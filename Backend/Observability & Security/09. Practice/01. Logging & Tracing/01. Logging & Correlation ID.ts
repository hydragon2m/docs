// ==============================================================
// Bài tập Thực hành: Structured Logging & Correlation ID với Pino
// File: Observability & Security/09. Practice/01. Logging & Tracing/01. Logging & Correlation ID.ts
// ==============================================================

/**
 * ĐỀ BÀI:
 * 1. Sử dụng `AsyncLocalStorage` của Node.js để lưu trữ `correlationId` (UUID) cho mỗi Request.
 * 2. Thiết lập một Express Middleware:
 *    - Đọc `x-correlation-id` từ Request Header, nếu không có thì sinh mới bằng UUID.
 *    - Lưu `correlationId` này vào `AsyncLocalStorage` store.
 *    - Thiết lập Response Header `x-correlation-id` trả về cho Client.
 * 
 * 3. Cấu hình Pino Logger:
 *    - Viết một hàm `log(message: string, level: 'info' | 'error')` tự động lấy `correlationId` 
 *      từ `AsyncLocalStorage` và in ra log dưới dạng structured JSON.
 *    - Logger cần loại bỏ/mask các trường nhạy cảm như `password` hoặc `token` nếu chúng xuất hiện trong data log.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

// Khởi tạo AsyncLocalStorage để lưu trữ Correlation ID
export const storage = new AsyncLocalStorage<Map<string, string>>();

// Giả lập Pino Logger
export class PinoLogger {
  // TODO 1: Viết hàm maskSensitiveData để ẩn thông tin nhạy cảm (password, token)
  private maskSensitiveData(data: any): any {
    if (!data) return data;
    const masked = { ...data };
    const sensitiveKeys = ['password', 'token', 'creditCard'];
    
    // Duyệt qua các keys của masked, nếu trùng key nhạy cảm thì thay thế bằng '***'
    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.includes(key)) {
        masked[key] = '***';
      }
    }
    return masked;
  }

  // TODO 2: Hoàn thiện hàm log cấu trúc JSON kèm theo correlationId lấy từ AsyncLocalStorage
  public log(level: 'info' | 'error', message: string, meta?: any) {
    const store = storage.getStore();
    const correlationId = store ? store.get('correlationId') : undefined;

    const logPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: correlationId || 'no-context',
      meta: this.maskSensitiveData(meta),
    };

    console.log(JSON.stringify(logPayload));
  }
}

const logger = new PinoLogger();

// TODO 3: Viết Middleware giả lập xử lý Request và lưu Correlation ID vào store
export function mockMiddleware(req: any, res: any, next: () => void) {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.headers = { ...res.headers, 'x-correlation-id': correlationId };

  const store = new Map<string, string>();
  store.set('correlationId', correlationId);

  // Chạy logic tiếp theo trong context của AsyncLocalStorage
  storage.run(store, () => {
    next();
  });
}

// ==============================================================
// KỊCH BẢN CHẠY THỬ (TEST SCENARIO)
// ==============================================================
function mockServiceLogic(userData: any) {
  // Service không nhận correlationId trực tiếp nhưng Logger vẫn phải lấy được từ Storage Context
  logger.log('info', 'Đang xử lý tạo tài khoản người dùng', userData);
}

function handleIncomingRequest() {
  const mockReq = {
    headers: { 'x-correlation-id': 'client-custom-uuid-9999' },
  };
  const mockRes = { headers: {} };

  mockMiddleware(mockReq, mockRes, () => {
    logger.log('info', 'Nhận request đăng ký tài khoản');
    
    // Giả lập gọi xuống tầng Service xử lý
    mockServiceLogic({ username: 'bob', password: 'my-super-secret-password-123' });
    
    logger.log('info', 'Hoàn tất request đăng ký tài khoản');
  });
}

// Chạy thử testcase
handleIncomingRequest();
