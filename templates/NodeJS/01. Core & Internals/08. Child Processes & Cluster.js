// Bài tập 08: Child Processes & Cluster
// Yêu cầu: Sử dụng mô-đun `child_process` để thực thi lệnh hệ điều hành.

const { exec } = require('child_process');

// 1. Viết mã gọi lệnh hệ điều hành `ping -c 3 google.com` (hoặc `ping -n 3 google.com` nếu trên Windows)
// sử dụng phương thức `exec`.
// - Nhận kết quả và in ra console.log.
// - Xử lý lỗi nếu lệnh ping thất bại hoặc không kết nối được internet.
