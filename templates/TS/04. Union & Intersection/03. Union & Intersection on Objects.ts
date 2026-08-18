// Bài tập 03: Union & Intersection on Objects
// Yêu cầu: Kết hợp linh hoạt giữa Union và Intersection.

interface IConsoleTransport {
  type: "console";
  color: boolean;
}

interface IFileTransport {
  type: "file";
  path: string;
}

interface IBaseLoggerConfig {
  appName: string;
}

// 1. Hãy tạo một kiểu `LoggerConfig` đại diện cho cấu hình hệ thống:
// - Bắt buộc phải chứa các trường của `IBaseLoggerConfig`
// - Và bắt buộc chọn 1 trong 2 phương thức vận chuyển: `IConsoleTransport` hoặc `IFileTransport`.
type LoggerConfig = IBaseLoggerConfig & (IConsoleTransport | IFileTransport);

// 2. Khai báo một biến `myLogger` hợp lệ kiểu `LoggerConfig` sử dụng phương thức console.
let myLogger;
