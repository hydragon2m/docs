// Bài tập 06: Streams (Luồng dữ liệu)
// Yêu cầu: Sử dụng pipeline để nén dữ liệu từ file một cách an toàn.

const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// 1. Hãy hoàn thành hàm `compressFile` nhận vào `sourcePath` và `destPath`.
// Sử dụng hàm `pipeline` để đọc file từ sourcePath, nén bằng zlib.createGzip()
// và ghi ra file nén tại destPath.
// Xử lý callback lỗi/thành công và dọn dẹp tài nguyên chính xác.

function compressFile(sourcePath, destPath) {
  // Thực hiện viết pipeline tại đây
}
