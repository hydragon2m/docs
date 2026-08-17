// Bài tập 01: Worker Threads
// Yêu cầu: Triển khai Worker Thread để tính toán số Fibonacci mà không làm chặn luồng chính.

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// 1. Hãy hoàn thành logic chạy đa luồng:
// - Nếu `isMainThread` là true:
//   - Khởi tạo một Worker chạy chính file này (`__filename`).
//   - Truyền dữ liệu số `42` qua `workerData`.
//   - Lắng nghe kết quả trả về từ Worker qua sự kiện 'message' và in ra console.
// - Nếu `isMainThread` là false:
//   - Lấy số từ `workerData`.
//   - Định nghĩa hàm tính fibonacci(n) đệ quy.
//   - Gửi kết quả tính được về cho luồng chính qua `parentPort.postMessage`.

if (isMainThread) {
  // Viết code luồng chính tại đây
} else {
  // Viết code luồng con tại đây
}
