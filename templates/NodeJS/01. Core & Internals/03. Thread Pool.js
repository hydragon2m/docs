// Bài tập 03: Thread Pool
// Yêu cầu: Viết code đo đạc hiệu năng của pbkdf2 đồng thời để kiểm chứng Thread Pool bottleneck.

const crypto = require('crypto');

// 1. Hãy viết một hàm `runHashTest` thực thi 6 tác vụ băm mật khẩu `crypto.pbkdf2` đồng thời.
// Đo đạc tổng thời gian chạy của từng tác vụ hoàn thành (sử dụng Date.now() hoặc performance.now()).
//
// 2. Chạy thử nghiệm bằng terminal:
// - Chạy bình thường: quan sát thời gian của 4 tác vụ đầu so với 2 tác vụ cuối.
// - Chạy lại sau khi đổi UV_THREADPOOL_SIZE lên 6: `UV_THREADPOOL_SIZE=6 node "03. Thread Pool.js"`
//   và quan sát sự cải thiện hiệu năng.

function runHashTest() {
  const start = Date.now();
  
  // Viết code băm 6 lần ở đây
}

// runHashTest();
