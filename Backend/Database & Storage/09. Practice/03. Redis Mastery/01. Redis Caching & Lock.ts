/**
 * ============================================================================
 * BÀI TẬP THỰC HÀNH: REDIS CORE CACHING STRATEGIES & DISTRIBUTED LOCKS
 * ============================================================================
 * Tệp: 01. Redis Caching & Lock.ts
 * Khóa học: Database & Storage - Redis Mastery
 *
 * MỤC TIÊU BÀI HỌC:
 * 1. Hiện thực hóa chiến lược Cache-Aside Pattern hoàn chỉnh với TypeScript.
 * 2. Ngăn ngừa triệt để 3 sự cố Caching kinh điển:
 *    - Cache Penetration (Thủng cache) thông qua Null Object Caching.
 *    - Cache Avalanche (Tuyết lở cache) thông qua TTL Jitter ngẫu nhiên.
 *    - Cache Stampede / Thundering Herd thông qua Mutex Lock.
 * 3. Xây dựng Trình quản lý Khóa phân tán (Distributed Lock Manager) chuẩn Production:
 *    - Cơ chế SET key value NX PX (Atomic Acquire).
 *    - Giải phóng khóa an toàn (Safe Release) bằng Lua Script chống xóa nhầm.
 *    - Tự động gia hạn khóa (Lock Heartbeat / Renewal) bằng Lua Script.
 * 4. Chạy kiểm thử tự động mô phỏng tải cao (Concurrent High-Load Simulation).
 * ============================================================================
 */

import { randomUUID, randomBytes } from "crypto";

// ============================================================================
// 1. IN-MEMORY REDIS CLIENT ENGINE (Mô phỏng Redis Server & ioredis API)
// ============================================================================
export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<string | null>;
  del(key: string): Promise<number>;
  eval(script: string, numKeys: number, ...args: any[]): Promise<any>;
  pexpire(key: string, milliseconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
}

/**
 * Trình giả lập Redis Server In-Memory hỗ trợ đầy đủ TTL, Atomic SET NX PX và Lua Scripts
 */
export class InMemoryRedisClient implements IRedisClient {
  private store: Map<string, { value: string; expireAt: number | null }> = new Map();

  private isExpired(entry: { value: string; expireAt: number | null }): boolean {
    if (entry.expireAt === null) return false;
    return Date.now() > entry.expireAt;
  }

  private cleanIfExpired(key: string) {
    const entry = this.store.get(key);
    if (entry && this.isExpired(entry)) {
      this.store.delete(key);
    }
  }

  async get(key: string): Promise<string | null> {
    this.cleanIfExpired(key);
    const entry = this.store.get(key);
    return entry ? entry.value : null;
  }

  async set(key: string, value: string, ...args: any[]): Promise<string | null> {
    this.cleanIfExpired(key);

    let ttlMs: number | null = null;
    let onlyIfNotExist = false;
    let onlyIfExist = false;

    for (let i = 0; i < args.length; i++) {
      const arg = String(args[i]).toUpperCase();
      if (arg === "EX" && i + 1 < args.length) {
        ttlMs = Number(args[i + 1]) * 1000;
        i++;
      } else if (arg === "PX" && i + 1 < args.length) {
        ttlMs = Number(args[i + 1]);
        i++;
      } else if (arg === "NX") {
        onlyIfNotExist = true;
      } else if (arg === "XX") {
        onlyIfExist = true;
      }
    }

    const exists = this.store.has(key);

    if (onlyIfNotExist && exists) {
      return null; // Không set nếu key đã tồn tại
    }

    if (onlyIfExist && !exists) {
      return null; // Không set nếu key chưa tồn tại
    }

    const expireAt = ttlMs !== null ? Date.now() + ttlMs : null;
    this.store.set(key, { value, expireAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async pexpire(key: string, milliseconds: number): Promise<number> {
    this.cleanIfExpired(key);
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expireAt = Date.now() + milliseconds;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    this.cleanIfExpired(key);
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expireAt === null) return -1;
    const remainingMs = entry.expireAt - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  /**
   * Giả lập thực thi Lua Script nguyên tử của Redis
   */
  async eval(script: string, numKeys: number, ...args: any[]): Promise<any> {
    const keys = args.slice(0, numKeys);
    const argv = args.slice(numKeys);

    const key = keys[0];
    this.cleanIfExpired(key);
    const currentValue = this.store.get(key)?.value || null;

    // 1. Kịch bản Lua Safe Unlock:
    // if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end
    if (script.includes('redis.call("del", KEYS[1])')) {
      const expectedToken = String(argv[0]);
      if (currentValue === expectedToken) {
        this.store.delete(key);
        return 1;
      }
      return 0;
    }

    // 2. Kịch bản Lua Safe Extend / Renewal:
    // if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("pexpire", KEYS[1], ARGV[2]) else return 0 end
    if (script.includes('redis.call("pexpire", KEYS[1], ARGV[2])')) {
      const expectedToken = String(argv[0]);
      const extraTtlMs = Number(argv[1]);
      if (currentValue === expectedToken) {
        const entry = this.store.get(key);
        if (entry) {
          entry.expireAt = Date.now() + extraTtlMs;
          return 1;
        }
      }
      return 0;
    }

    return null;
  }
}

// ============================================================================
// BÀI TẬP 1: TRIỂN KHAI ADVANCED CACHE-ASIDE SERVICE
// ============================================================================

export interface CacheAsideOptions {
  ttlSeconds: number;
  jitterSeconds?: number;
  cacheNull?: boolean;
  nullTtlSeconds?: number;
  lockTimeoutMs?: number;
}

export class CacheAsideService {
  private static readonly NULL_PLACEHOLDER = "__NULL_PLACEHOLDER__";

  constructor(private readonly redis: IRedisClient) {}

  /**
   * [TODO 1]: Hiện thực hàm getOrSet()
   * Quy trình xử lý:
   * 1. Kiểm tra Cache -> Nếu có dữ liệu trả về ngay.
   *    - Nếu là NULL_PLACEHOLDER -> Trả về null (Chống Cache Penetration).
   * 2. Nếu Cache Miss -> Dùng Mutex Lock (SET lock:key token NX PX 5000) chống Cache Stampede.
   * 3. Luồng có lock -> Gọi fetcher() lấy dữ liệu gốc từ DB.
   *    - Nếu DB trả về null/undefined -> Lưu NULL_PLACEHOLDER với nullTtlSeconds.
   *    - Nếu có dữ liệu -> Tính TTL + random(jitter) -> Ghi cache -> Trả về.
   * 4. Các luồng không có lock -> Chờ 50ms và gọi lại đệ quy getOrSet().
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T | null>,
    options: CacheAsideOptions
  ): Promise<T | null> {
    const {
      ttlSeconds,
      jitterSeconds = 10,
      cacheNull = true,
      nullTtlSeconds = 30,
      lockTimeoutMs = 5000,
    } = options;

    // BƯỚC 1: Kiểm tra cache hiện tại
    const cached = await this.redis.get(key);
    if (cached !== null) {
      if (cached === CacheAsideService.NULL_PLACEHOLDER) {
        return null; // Chặn đứng Cache Penetration
      }
      return JSON.parse(cached) as T;
    }

    // BƯỚC 2: Cạnh tranh Mutex Lock để bảo vệ DB chống Cache Stampede
    const lockKey = `lock:${key}`;
    const lockToken = randomUUID();
    const acquired = await this.redis.set(lockKey, lockToken, "PX", lockTimeoutMs, "NX");

    if (acquired === "OK") {
      try {
        // Kiểm tra lại Cache lần 2 (Double-checked Locking Pattern)
        const doubleCheck = await this.redis.get(key);
        if (doubleCheck !== null) {
          if (doubleCheck === CacheAsideService.NULL_PLACEHOLDER) return null;
          return JSON.parse(doubleCheck) as T;
        }

        // Gọi DB thông qua fetcher callback
        const freshData = await fetcher();

        if (freshData === null || freshData === undefined) {
          if (cacheNull) {
            await this.redis.set(key, CacheAsideService.NULL_PLACEHOLDER, "EX", nullTtlSeconds);
          }
          return null;
        }

        // Tính TTL Jitter chống Cache Avalanche
        const jitter = Math.floor(Math.random() * (jitterSeconds + 1));
        const effectiveTtl = ttlSeconds + jitter;

        await this.redis.set(key, JSON.stringify(freshData), "EX", effectiveTtl);
        return freshData;
      } finally {
        // Mở khóa an toàn
        await this.releaseInternalLock(lockKey, lockToken);
      }
    } else {
      // Các luồng khác không có lock: Đợi 50ms rồi thử lại
      await new Promise((resolve) => setTimeout(resolve, 50));
      return this.getOrSet(key, fetcher, options);
    }
  }

  private async releaseInternalLock(lockKey: string, lockToken: string): Promise<boolean> {
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.redis.eval(luaScript, 1, lockKey, lockToken);
    return result === 1;
  }
}

// ============================================================================
// BÀI TẬP 2: TRIỂN KHAI PRODUCTION-GRADE DISTRIBUTED LOCK MANAGER
// ============================================================================

export interface LockToken {
  resource: string;
  token: string;
  ttlMs: number;
  acquiredAt: number;
}

export class DistributedLockManager {
  private static readonly SAFE_RELEASE_LUA = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  private static readonly SAFE_EXTEND_LUA = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("pexpire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  constructor(private readonly redis: IRedisClient) {}

  /**
   * [TODO 2.1]: Giành quyền kiểm soát Khóa Phân tán với Retry Mechanism
   */
  public async acquire(
    resource: string,
    ttlMs = 10000,
    retryAttempts = 10,
    retryDelayMs = 100
  ): Promise<LockToken | null> {
    const lockKey = `dlock:${resource}`;
    const token = randomBytes(16).toString("hex");

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      const result = await this.redis.set(lockKey, token, "PX", ttlMs, "NX");

      if (result === "OK") {
        return {
          resource,
          token,
          ttlMs,
          acquiredAt: Date.now(),
        };
      }

      // Thêm Random Backoff Jitter để các worker không thử lại cùng mili-giây
      const jitter = Math.floor(Math.random() * 30);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs + jitter));
    }

    return null; // Không lấy được lock sau số lần retry quy định
  }

  /**
   * [TODO 2.2]: Mở khóa an toàn bằng Lua Script (Chỉ xóa nếu Token khớp)
   */
  public async release(lock: LockToken): Promise<boolean> {
    const lockKey = `dlock:${lock.resource}`;
    const result = await this.redis.eval(
      DistributedLockManager.SAFE_RELEASE_LUA,
      1,
      lockKey,
      lock.token
    );
    return result === 1;
  }

  /**
   * [TODO 2.3]: Gia hạn thời gian sống của Khóa (Heartbeat Pattern)
   */
  public async extend(lock: LockToken, extraTtlMs: number): Promise<boolean> {
    const lockKey = `dlock:${lock.resource}`;
    const result = await this.redis.eval(
      DistributedLockManager.SAFE_EXTEND_LUA,
      1,
      lockKey,
      lock.token,
      extraTtlMs
    );
    return result === 1;
  }

  /**
   * [TODO 2.4]: Wrapper tự động thực thi task trong phạm vi Lock
   */
  public async withLock<T>(
    resource: string,
    ttlMs: number,
    task: (lock: LockToken) => Promise<T>
  ): Promise<T> {
    const lock = await this.acquire(resource, ttlMs);
    if (!lock) {
      throw new Error(`[DistributedLock] Không thể giành quyền kiểm soát tài nguyên '${resource}'!`);
    }

    try {
      return await task(lock);
    } finally {
      await this.release(lock);
    }
  }
}

// ============================================================================
// KỊCH BẢN KIỂM THỬ THỰC TẾ & MÔ PHỎNG TẢI CAO (SIMULATION TESTS)
// ============================================================================

async function runRedisMasterySuite() {
  console.log("================================================================");
  console.log("🚀 KHỞI CHẠY BỘ KIỂM THỬ REDIS CACHING & DISTRIBUTED LOCK");
  console.log("================================================================\n");

  const redis = new InMemoryRedisClient();
  const cacheService = new CacheAsideService(redis);
  const lockManager = new DistributedLockManager(redis);

  // --------------------------------------------------------------------------
  // TEST 1: Cache Hit vs Cache Miss cơ bản
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Cache Hit vs Cache Miss ---");
  let dbCallCount = 0;
  const mockDbFetchUser = async (id: string) => {
    dbCallCount++;
    console.log(`  [Database] Đang thực hiện truy vấn SQL lấy User '${id}'...`);
    return { id, name: "Nguyễn Văn Dev", balance: 5000000 };
  };

  // Lần 1: Cache Miss -> Gọi DB
  const user1 = await cacheService.getOrSet("user:101", () => mockDbFetchUser("101"), {
    ttlSeconds: 60,
  });
  console.log("Lần 1 (Cache Miss):", user1, "| DB Calls:", dbCallCount);

  // Lần 2: Cache Hit -> Trả về từ Redis, DB không bị gọi
  const user2 = await cacheService.getOrSet("user:101", () => mockDbFetchUser("101"), {
    ttlSeconds: 60,
  });
  console.log("Lần 2 (Cache Hit):", user2, "| DB Calls:", dbCallCount);
  console.log("=> Kết quả Test 1:", dbCallCount === 1 ? "✅ PASS" : "❌ FAIL");

  // --------------------------------------------------------------------------
  // TEST 2: Chống Cache Stampede (Thundering Herd) với 50 Concurrent Requests
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: Chống Cache Stampede (50 Luồng Đồng Thời) ---");
  let heavyDbCalls = 0;
  const mockHeavyQuery = async () => {
    heavyDbCalls++;
    // Giả lập truy vấn SQL nặng mất 100ms
    await new Promise((r) => setTimeout(r, 100));
    return { flashSaleId: "fs-999", discount: 50, item: "iPhone 16 Pro Max" };
  };

  console.log("  Gửi đồng thời 50 requests truy vấn Hot Key vừa hết hạn...");
  const promises = Array.from({ length: 50 }).map(() =>
    cacheService.getOrSet("sale:flash_hot_key", mockHeavyQuery, { ttlSeconds: 30 })
  );

  const results = await Promise.all(promises);
  console.log(`  50 requests hoàn tất. Số lần Database thực sự bị truy vấn: ${heavyDbCalls}`);
  console.log("  Dữ liệu trả về đúng cho 50 luồng:", results.every((r) => r?.flashSaleId === "fs-999"));
  console.log("=> Kết quả Test 2:", heavyDbCalls === 1 ? "✅ PASS (Chỉ 1 query DB duy nhất)" : "❌ FAIL");

  // --------------------------------------------------------------------------
  // TEST 3: Chống Cache Penetration (Truy vấn ID không tồn tại)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3: Chống Cache Penetration (Null Object Caching) ---");
  let notFoundDbCalls = 0;
  const mockFetchNonExistent = async () => {
    notFoundDbCalls++;
    return null; // DB không tìm thấy bản ghi
  };

  await cacheService.getOrSet("user:non_existent_999", mockFetchNonExistent, {
    ttlSeconds: 60,
    cacheNull: true,
    nullTtlSeconds: 5,
  });
  // Lần 2 thử query lại key này
  await cacheService.getOrSet("user:non_existent_999", mockFetchNonExistent, {
    ttlSeconds: 60,
    cacheNull: true,
  });

  console.log(`  Số lần DB bị gọi khi truy vấn ID ảo 2 lần liên tiếp: ${notFoundDbCalls}`);
  console.log("=> Kết quả Test 3:", notFoundDbCalls === 1 ? "✅ PASS (Đã chặn đứng ở Cache)" : "❌ FAIL");

  // --------------------------------------------------------------------------
  // TEST 4: Distributed Lock Mutual Exclusion (Chống Race Condition rút tiền)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 4: Distributed Lock Mutual Exclusion (Rút Tiền Đồng Thời) ---");
  let bankAccountBalance = 1000;
  const withdrawAmount = 200;

  // Giả lập 5 Worker cùng cố gắng rút 200k từ tài khoản 1000k
  const simulateWithdraw = async (workerId: number) => {
    return lockManager.withLock("wallet:user_888", 2000, async () => {
      console.log(`  [Worker ${workerId}] Đã giành được Lock. Đọc số dư hiện tại: ${bankAccountBalance}`);
      if (bankAccountBalance >= withdrawAmount) {
        // Giả lập độ trễ ghi DB và mạng
        await new Promise((r) => setTimeout(r, 40));
        bankAccountBalance -= withdrawAmount;
        console.log(`  [Worker ${workerId}] Rút thành công 200k. Số dư mới: ${bankAccountBalance}`);
        return { workerId, success: true };
      }
      return { workerId, success: false, reason: "Hết tiền" };
    });
  };

  const withdrawWorkers = [1, 2, 3, 4, 5].map((id) => simulateWithdraw(id));
  await Promise.all(withdrawWorkers);

  console.log(`  Số dư cuối cùng sau 5 lần rút: ${bankAccountBalance}k (Kỳ vọng: 0k)`);
  console.log("=> Kết quả Test 4:", bankAccountBalance === 0 ? "✅ PASS (Toàn vẹn số dư)" : "❌ FAIL");

  // --------------------------------------------------------------------------
  // TEST 5: An toàn Khóa - Chống Xóa Nhầm Khóa Của Worker Khác
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 5: Lock Safety - Chống Xóa Nhầm Khi Quá Hạn TTL ---");
  // Worker A lấy lock với TTL ngắn (100ms)
  const lockA = await lockManager.acquire("resource:shared", 100);
  console.log("  Worker A đã lấy lock:", lockA !== null);

  // Worker A bị tắc nghẽn xử lý lâu hơn TTL (150ms)
  await new Promise((r) => setTimeout(r, 150));

  // Lúc này Lock của A đã hết hạn. Worker B nhảy vào lấy lock mới
  const lockB = await lockManager.acquire("resource:shared", 2000);
  console.log("  Worker B đã lấy lock mới thành công:", lockB !== null);

  // Worker A giờ mới tỉnh dậy và gọi release() với token cũ của A
  if (lockA) {
    const releaseResultA = await lockManager.release(lockA);
    console.log("  Worker A cố xóa Lock (bằng token cũ):", releaseResultA ? "Xóa được" : "Bị từ chối (An toàn!)");
  }

  // Kiểm tra xem Lock của B có còn nguyên vẹn trong Redis không
  const isLockBStillActive = (await redis.get("dlock:resource:shared")) === lockB?.token;
  console.log("  Lock của Worker B vẫn còn hiệu lực:", isLockBStillActive);

  // Cleanup B
  if (lockB) await lockManager.release(lockB);
  console.log("=> Kết quả Test 5:", isLockBStillActive ? "✅ PASS (Bảo vệ an toàn đa luồng)" : "❌ FAIL");

  console.log("\n================================================================");
  console.log("🎉 TẤT CẢ 5 BÀI TEST REDIS & LOCKS ĐỀU HOÀN THÀNH XUẤT SẮC!");
  console.log("================================================================");
}

// Thực thi nếu file được chạy trực tiếp
if (require.main === module) {
  runRedisMasterySuite().catch(console.error);
}
