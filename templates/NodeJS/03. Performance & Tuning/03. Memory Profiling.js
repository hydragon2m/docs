// Bài tập 03: Memory Profiling & Leak Hunting
// Yêu cầu: Viết code chứa lỗ hổng rò rỉ bộ nhớ thực tế, sử dụng `v8.writeHeapSnapshot()` để chụp dữ liệu.

const http = require('http');
const v8 = require('v8');

// Giả lập rò rỉ bộ nhớ: Lưu trữ request data toàn cục không bao giờ xóa
const requestLogs = [];

const server = http.createServer((req, res) => {
  if (req.url === '/leak') {
    // Mỗi request lại đẩy thêm một object lớn vào mảng
    requestLogs.push({
      timestamp: Date.now(),
      headers: req.headers,
      largeData: new Array(100000).fill('garbage_data')
    });
    res.end('Logged');
  } else if (req.url === '/snapshot') {
    const filename = v8.writeHeapSnapshot();
    res.end(`Snapshot saved to: ${filename}`);
  } else {
    res.end('OK');
  }
});

server.listen(3000, () => {
  console.log("Server running. Call /leak a few times, then call /snapshot to check memory leak!");
});
