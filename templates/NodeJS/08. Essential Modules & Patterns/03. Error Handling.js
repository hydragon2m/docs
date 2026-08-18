// Bài tập 03: Error Handling Patterns (Xử lý lỗi toàn diện trong Node.js)
// Yêu cầu: Triển khai Custom Error Class, Express Error Middleware và Process-level Exception Handlers.

// ============================================================================
// BÀI TẬP 1: Xây dựng Custom Error Class (AppError)
// ============================================================================
// Yêu cầu:
// 1. Tạo class `AppError` kế thừa từ `Error` gốc của JavaScript.
// 2. Constructor nhận vào 2 tham số: `message` (chuỗi) và `statusCode` (số nguyên HTTP code, ví dụ: 400, 404, 500).
// 3. Khởi tạo các thuộc tính:
//    - `this.statusCode`: Lưu mã HTTP status code.
//    - `this.status`: Gán 'fail' nếu statusCode bắt đầu bằng 4xx (400-499), ngược lại gán 'error' cho 5xx.
//    - `this.isOperational`: Luôn gán là `true` để đánh dấu đây là lỗi vận hành đã dự kiến.
// 4. Sử dụng `Error.captureStackTrace(this, this.constructor)` để lưu trữ Stack Trace sạch.

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    // TODO: Hoàn thành constructor tại đây
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// BÀI TẬP 2: Viết Express Error Handling Middleware tập trung
// ============================================================================
// Yêu cầu:
// 1. Viết hàm middleware `errorHandler(err, req, res, next)` (đủ 4 tham số).
// 2. Gán giá trị mặc định: `err.statusCode = err.statusCode || 500` và `err.status = err.status || 'error'`.
// 3. Phân nhánh xử lý:
//    - Nếu `err.isOperational === true` (Lỗi vận hành):
//        Trả về `res.status(err.statusCode).json({ status: err.status, message: err.message })`.
//    - Nếu `err.isOperational` là false hoặc undefined (Programmer Error / Bug):
//        Ghi log `console.error('💥 [LOG NỘI BỘ BUG]:', err);`
//        Trả về `res.status(500).json({ status: 'error', message: 'Đã có lỗi nghiêm trọng xảy ra từ máy chủ!' })`.

function errorHandler(err, req, res, next) {
  // TODO: Hoàn thành Express Error Middleware tại đây
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programmer Error: Log nội bộ và ẩn thông tin với Client
  console.error('💥 [LOG NỘI BỘ BUG]:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Đã có lỗi nghiêm trọng xảy ra từ máy chủ!',
  });
}

// ============================================================================
// BÀI TẬP 3: Cấu hình Bắt lỗi toàn cục ở cấp độ Tiến trình (Process-Level Safety)
// ============================================================================
// Yêu cầu:
// 1. Đăng ký sự kiện `process.on('uncaughtException', ...)`:
//    - Ghi log thông tin lỗi (tên lỗi, thông điệp, stack trace).
//    - Thoát tiến trình ngay lập tức với `process.exit(1)` (Fail Fast).
//
// 2. Đăng ký sự kiện `process.on('unhandledRejection', ...)`:
//    - Nhận tham số (reason, promise).
//    - Ghi log lý do bị reject.
//    - Nếu có đối tượng `server` đang lắng nghe, gọi `server.close(() => process.exit(1))` để giải phóng kết nối trước khi thoát.

function setupGlobalErrorHandlers(serverInstance = null) {
  // TODO: Đăng ký uncaughtException
  process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Đang dừng tiến trình...');
    console.error(`Tên lỗi: ${err.name} | Chi tiết: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });

  // TODO: Đăng ký unhandledRejection
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED PROMISE REJECTION!');
    console.error('Lý do:', reason);
    if (serverInstance && typeof serverInstance.close === 'function') {
      serverInstance.close(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

// ============================================================================
// KIỂM TRA MÃ NGUỒN (TEST RUN)
// ============================================================================
if (require.main === module) {
  console.log('--- TEST 1: AppError Class ---');
  const notFoundErr = new AppError('Không tìm thấy tài nguyên', 404);
  console.log('StatusCode:', notFoundErr.statusCode); // 404
  console.log('Status:', notFoundErr.status);         // 'fail'
  console.log('IsOperational:', notFoundErr.isOperational); // true

  console.log('\n--- TEST 2: Error Middleware ---');
  const mockReq = {};
  const mockRes = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };

  // Test với Operational Error
  errorHandler(notFoundErr, mockReq, mockRes, () => {});
  console.log('Operational Error Response Code:', mockRes.statusCode); // 404
  console.log('Operational Error Response Body:', mockRes.body);

  // Test với Programmer Error (ví dụ: TypeError)
  const programmerErr = new TypeError('Cannot read properties of undefined');
  errorHandler(programmerErr, mockReq, mockRes, () => {});
  console.log('Programmer Error Response Code:', mockRes.statusCode); // 500
  console.log('Programmer Error Response Body:', mockRes.body);

  console.log('\n✅ Hoàn thành kiểm tra bài tập 03!');
}

module.exports = {
  AppError,
  errorHandler,
  setupGlobalErrorHandlers,
};
