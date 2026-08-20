// ==============================================================
// Bài tập Thực hành: ES6 Collections (Map, Set, WeakMap, WeakSet)
// File: templates/TS/01. Fundamentals/13. ES6 Collections.ts
// ==============================================================
export {};

/**
 * ĐỀ BÀI:
 * 
 * 1. Thiết lập một lớp `SessionManager` quản lý danh sách session đăng nhập:
 *    - Sử dụng một `Map` lưu trữ thông tin session với: Key là `token` (string), Value là `SessionData` object.
 *    - Viết phương thức `createSession(token: string, userId: string, ttlMs: number): void` tạo mới session.
 *    - Viết phương thức `getSession(token: string): SessionData | undefined` lấy thông tin session (nếu hết hạn thì tự động xóa và trả về undefined).
 *    - Viết phương thức `cleanExpiredSessions(): number` duyệt qua Map và xóa tất cả các session đã hết hạn. Trả về số lượng session đã xóa.
 * 
 * 2. Viết hàm `removeDuplicates<T>(items: T[]): T[]` sử dụng `Set` để trả về một mảng chứa các phần tử duy nhất không trùng lặp.
 * 
 * 3. Triển khai cơ chế cache kết quả tính toán (Memoization) cho các Object bằng `WeakMap`:
 *    - Tạo một `WeakMap` tên là `calculationCache` lưu trữ cache kết quả.
 *    - Viết hàm `heavyCompute(obj: object): number` thực thi:
 *      - Nếu `obj` đã có trong cache, trả về kết quả ngay lập tức (in log: 'Cache hit').
 *      - Nếu chưa có, tính toán một giá trị ngẫu nhiên hoặc giả lập (ví dụ: Math.random() * 100), lưu vào cache và trả về kết quả (in log: 'Cache miss').
 */

export interface SessionData {
  userId: string;
  expiresAt: number; // Timestamp miliseconds khi hết hạn
}

// ==============================================================
// BÀI TẬP 1: MAP SESSION MANAGER
// ==============================================================
export class SessionManager {
  private sessions = new Map<string, SessionData>();

  // TODO 1: Viết phương thức tạo mới session
  createSession(token: string, userId: string, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.sessions.set(token, { userId, expiresAt });
  }

  // TODO 2: Viết phương thức lấy session (và tự động xóa nếu hết hạn)
  getSession(token: string): SessionData | undefined {
    const session = this.sessions.get(token);
    if (!session) return undefined;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token); // Tự động xóa nếu hết hạn
      return undefined;
    }

    return session;
  }

  // TODO 3: Viết phương thức xóa tất cả session đã hết hạn
  cleanExpiredSessions(): number {
    let deletedCount = 0;
    const now = Date.now();

    for (const [token, data] of this.sessions.entries()) {
      if (now > data.expiresAt) {
        this.sessions.delete(token);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  get activeSessionsCount(): number {
    return this.sessions.size;
  }
}

// ==============================================================
// BÀI TẬP 2: UNIQUE ARRAY WITH SET
// ==============================================================
// TODO 4: Hoàn thiện hàm removeDuplicates sử dụng Set
export function removeDuplicates<T>(items: T[]): T[] {
  return [...new Set<T>(items)];
}

// ==============================================================
// BÀI TẬP 3: WEAKMAP MEMOIZATION
// ==============================================================
const calculationCache = new WeakMap<object, number>();

// TODO 5: Hoàn thiện hàm heavyCompute sử dụng WeakMap
export function heavyCompute(obj: object): number {
  if (calculationCache.has(obj)) {
    console.log('Cache hit');
    return calculationCache.get(obj)!;
  }

  console.log('Cache miss');
  const result = Math.floor(Math.random() * 100) + 1;
  calculationCache.set(obj, result);
  return result;
}

// ==============================================================
// KỊCH BẢN KIỂM THỬ (TEST SCENARIO) - KHÔNG ĐƯỢC SỬA
// ==============================================================
function runTest() {
  console.log('=== TEST 1: MAP SESSION MANAGER ===');
  const manager = new SessionManager();
  
  manager.createSession('token-1', 'user-bob', 1000); // Hết hạn sau 1 giây
  manager.createSession('token-2', 'user-alice', 5000); // Hết hạn sau 5 giây
  
  console.log('Active Sessions:', manager.activeSessionsCount); // Expected: 2
  if (manager.activeSessionsCount !== 2) throw new Error('Test 1.1 Fail');

  // Test get session
  const s1 = manager.getSession('token-1');
  console.log('Get Token 1 before expiry:', s1?.userId); // Expected: user-bob
  if (s1?.userId !== 'user-bob') throw new Error('Test 1.2 Fail');

  // Giả lập trôi qua 1.5 giây
  console.log('Đang giả lập trôi qua 1.5 giây...');
  setTimeout(() => {
    const s1Expired = manager.getSession('token-1');
    console.log('Get Token 1 after expiry:', s1Expired); // Expected: undefined
    if (s1Expired !== undefined) throw new Error('Test 1.3 Fail');

    const deleted = manager.cleanExpiredSessions();
    console.log('Xóa các session hết hạn:', deleted); // Token 1 đã được xóa trước đó hoặc xóa tại đây
    
    console.log('Active Sessions remaining:', manager.activeSessionsCount); // Expected: 1 (chỉ còn token-2)
    if (manager.activeSessionsCount !== 1) throw new Error('Test 1.4 Fail');

    console.log('\n=== TEST 2: REMOVE DUPLICATES ===');
    const numbers = [1, 2, 2, 3, 4, 4, 5, 1];
    const unique = removeDuplicates(numbers);
    console.log('Unique numbers:', unique); // Expected: [1, 2, 3, 4, 5]
    if (JSON.stringify(unique) !== JSON.stringify([1, 2, 3, 4, 5])) throw new Error('Test 2 Fail');

    console.log('\n=== TEST 3: WEAKMAP MEMOIZATION ===');
    const complexObj = { id: 'large-data-object' };
    
    const r1 = heavyCompute(complexObj); // In 'Cache miss'
    const r2 = heavyCompute(complexObj); // In 'Cache hit'
    
    console.log('Result 1:', r1);
    console.log('Result 2:', r2);
    if (r1 !== r2) throw new Error('Test 3 Fail');

    console.log('\n🎉 TUYỆT VỜI! TẤT CẢ CÁC BÀI TẬP ES6 COLLECTIONS ĐÃ CHẠY PASS!');
  }, 1600);
}

runTest();
