// Bài tập 05: instanceof & Type Assertions
// Yêu cầu: Sử dụng instanceof để check lớp (Class) và as để ép kiểu an toàn.

// 1. Dùng instanceof:
// Cho 2 lớp sau:
class FileLogger {
  logToFile(msg: string) { console.log("Ghi file: " + msg); }
}
class DBLogger {
  logToDB(msg: string) { console.log("Ghi DB: " + msg); }
}

// Viết hàm `runLogger` nhận vào `logger` (FileLogger | DBLogger) và `message` (string).
// Dùng instanceof để gọi đúng hàm tương ứng.
function runLogger(logger: FileLogger | DBLogger, message: string) {
  // Logic
}


// 2. Dùng Type Assertion (as):
// Cho một phần tử DOM giả lập kiểu `any` hoặc `unknown`:
let rawElement: unknown = { tagName: "BUTTON", click: () => console.log("Clicked!") };

// Hãy ép kiểu biến `rawElement` sang kiểu `{ click(): void }` bằng từ khóa `as` 
// để có thể gọi hàm click() mà không bị báo lỗi đỏ compile.
