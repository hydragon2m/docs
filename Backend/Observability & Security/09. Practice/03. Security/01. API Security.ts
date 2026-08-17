// ==============================================================
// Bài tập Thực hành: OWASP Top 10 & API Hardening - Bảo mật ứng dụng
// File: Observability & Security/09. Practice/03. Security/01. API Security.ts
// ==============================================================

/**
 * ĐỀ BÀI:
 * 1. Thiết lập Rate Limiter thủ công sử dụng Redis:
 *    - Giới hạn mỗi IP chỉ được gọi tối đa 5 lần trong vòng 1 phút.
 *    - Sử dụng thuật toán Fixed Window Counter với Redis `INCR` + `EXPIRE`.
 *    - Nếu vượt quá giới hạn, trả về lỗi HTTP 429 (Too Many Requests).
 *
 * 2. Viết hàm `sanitizeInput(input: string)` chống XSS:
 *    - Escape các ký tự HTML nguy hiểm: `<`, `>`, `"`, `'`, `&`.
 *    - Kiểm tra và từ chối các chuỗi chứa ký tự SQL Injection nguy hiểm phổ biến: `' OR 1=1`, `; DROP TABLE`, `UNION SELECT`.
 *
 * 3. Viết hàm `maskSensitiveResponse(data: any)`:
 *    - Tự động ẩn (mask) các trường nhạy cảm trong response trả về cho Client.
 *    - Tìm kiếm đệ quy (deep) các key nhạy cảm: `password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `secret`.
 *    - Thay thế giá trị bằng `'[REDACTED]'`.
 */

// ==============================================================
// PHẦN 1: RATE LIMITER VỚI REDIS
// ==============================================================

// Giả lập Redis Client đơn giản
class MockRedis {
  private store: Map<string, { value: number; expiry: number }> = new Map();

  async incr(key: string): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || entry.expiry < now) {
      this.store.set(key, { value: 1, expiry: now + 60000 });
      return 1;
    }
    entry.value += 1;
    return entry.value;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    return Math.ceil((entry.expiry - Date.now()) / 1000);
  }
}

const redis = new MockRedis();

// TODO 1: Hoàn thiện hàm rateLimiter kiểm tra số lần gọi API của IP
export async function rateLimiter(
  ip: string,
  maxRequests: number = 5,
  windowSeconds: number = 60,
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const key = `rate_limit:${ip}`;

  // 1. Tăng counter cho IP này
  const currentCount = await redis.incr(key);

  // 2. Kiểm tra số lần gọi hiện tại so với giới hạn
  // 3. Nếu vượt quá, lấy TTL còn lại để trả về retryAfter
  // 4. Trả về { allowed, remaining, retryAfter? }

  // VIẾT CODE TẠI ĐÂY
  return { allowed: true, remaining: maxRequests - currentCount };
}

// ==============================================================
// PHẦN 2: INPUT SANITIZATION - CHỐNG XSS & SQL INJECTION
// ==============================================================

// TODO 2: Hoàn thiện hàm sanitizeInput chống XSS và SQL Injection
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input;

  // Bước A: Escape ký tự HTML nguy hiểm
  let sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Bước B: Kiểm tra SQL Injection patterns
  const sqlInjectionPatterns = [
    /'\s*or\s+1\s*=\s*1/i,
    /;\s*drop\s+table/i,
    /union\s+select/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /--\s*$/,
    /\/\*.*\*\//,
  ];

  // VIẾT CODE TẠI ĐÂY: Nếu phát hiện pattern SQL Injection, ném ra Error('Input contains invalid characters')

  return sanitized;
}

// ==============================================================
// PHẦN 3: MASK DỮ LIỆU NHẠY CẢM TRONG RESPONSE
// ==============================================================

const SENSITIVE_KEYS = new Set([
  'password', 'passwordHash', 'passwordSalt',
  'token', 'accessToken', 'refreshToken',
  'secret', 'apiKey', 'creditCard', 'cvv',
]);

// TODO 3: Hoàn thiện hàm maskSensitiveResponse xử lý đệ quy
export function maskSensitiveResponse<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveResponse(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const masked: any = {};
    for (const [key, value] of Object.entries(data as any)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        masked[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        masked[key] = maskSensitiveResponse(value); // Đệ quy với object/array lồng nhau
      } else {
        masked[key] = value;
      }
    }
    return masked as T;
  }

  return data;
}

// ==============================================================
// KỊCH BẢN CHẠY THỬ (TEST SCENARIO)
// ==============================================================
async function runTests() {
  console.log('=== TEST 1: RATE LIMITER ===');
  const testIp = '192.168.1.100';
  for (let i = 1; i <= 7; i++) {
    const result = await rateLimiter(testIp, 5, 60);
    console.log(`Request ${i}:`, result);
  }

  console.log('\n=== TEST 2: INPUT SANITIZATION ===');
  const safeInput = 'Hello World, <user>!';
  const xssInput = '<script>alert("XSS")</script>';
  const sqlInput = "admin' OR 1=1 --";

  console.log('Safe input:', sanitizeInput(safeInput));
  console.log('XSS input:', sanitizeInput(xssInput));
  try {
    console.log('SQL input:', sanitizeInput(sqlInput));
  } catch (e: any) {
    console.error('SQL Injection detected:', e.message);
  }

  console.log('\n=== TEST 3: MASK SENSITIVE RESPONSE ===');
  const userResponse = {
    id: 'usr-001',
    email: 'bob@example.com',
    password: 'plaintext-password-123',
    accessToken: 'eyJhbGciOiJIUzI1NiJ9.very.sensitive',
    profile: {
      name: 'Bob',
      creditCard: '4111 1111 1111 1111',
    },
  };

  console.log('Before masking:', JSON.stringify(userResponse, null, 2));
  console.log('After masking:', JSON.stringify(maskSensitiveResponse(userResponse), null, 2));
}

runTests();
