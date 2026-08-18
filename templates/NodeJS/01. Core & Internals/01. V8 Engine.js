// Bài tập 01: V8 Engine & Memory Management
// Yêu cầu: Viết một đoạn code Node.js để kiểm chứng cơ chế cấp phát bộ nhớ và tìm hiểu Memory Leak.

// 1. Hãy hoàn thành hàm `printMemory` sử dụng `process.memoryUsage()` 
// để in ra thông số `heapUsed` dưới dạng Megabytes (MB).
function printMemory() {
  const memory = process.memoryUsage();
  const heapUsedMB = (memory.heapUsed / 1024 / 1024).toFixed(2);
  console.log(`Heap Used: ${heapUsedMB} MB`);
}

// 2. Viết một đoạn code giả lập hành vi Memory Leak:
// - Tạo một mảng lớn toàn cục `leakArray`.
// - Sử dụng `setInterval` cứ mỗi 100ms lại tạo thêm một mảng mới chứa 1.000.000 số ngẫu nhiên 
//   và push vào `leakArray`.
// - Cứ mỗi 1 giây (1000ms) lại gọi hàm `printMemory()` để quan sát sự tăng trưởng liên tục của RAM.
//
// Yêu cầu: Comment dòng code chạy để không tự động chạy vô hạn khi khởi động, 
// nhưng bạn có thể chạy thử trực tiếp bằng lệnh `node "01. V8 Engine.js"` trong terminal để quan sát!

let leakArray = [];

function startLeak() {
  console.log("Bắt đầu chạy giả lập rò rỉ bộ nhớ (Memory Leak)...");
  printMemory();

  const leakInterval = setInterval(() => {
    // Viết code push dữ liệu rác vào leakArray tại đây để giả lập leak
  }, 100);

  const logInterval = setInterval(() => {
    printMemory();
  }, 1000);

  // Tự động dừng sau 10 giây để tránh crash máy
  setTimeout(() => {
    clearInterval(leakInterval);
    clearInterval(logInterval);
    leakArray = []; // Giải phóng bộ nhớ
    console.log("Đã dừng giả lập leak và giải phóng bộ nhớ.");
    printMemory();
  }, 10000);
}

// startLeak(); // Bỏ comment dòng này nếu muốn chạy thực tế bằng terminal!
