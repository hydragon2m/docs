// Bài tập 02: CPU Profiling
// Yêu cầu: Viết code chứa một hàm nghẽn CPU ẩn, thực hành chạy cờ `--prof` để tìm ra nó.

const http = require('http');

// Hàm nghẽn CPU cố ý
function heavyCalculation() {
  let count = 0;
  for (let i = 0; i < 5e7; i++) {
    count += Math.sqrt(i);
  }
  return count;
}

const server = http.createServer((req, res) => {
  if (req.url === '/heavy') {
    const result = heavyCalculation();
    res.end(`Result: ${result}`);
  } else {
    res.end('OK');
  }
});

server.listen(3000, () => {
  console.log("Server running on port 3000. Try profiling with:");
  console.log("node --prof \"02. CPU Profiling.js\"");
});
