// Bài tập 02: JWT Authentication
// Yêu cầu: Viết hàm tạo Access Token và hàm Middleware xác thực JWT.

const jwt = require('jsonwebtoken');

const SECRET_KEY = "my_super_secret_key";

// 1. Viết hàm `generateTokens(user)`:
// - Tạo và trả về đối tượng { accessToken }
// - accessToken có thời hạn 10 phút, payload chứa { id: user.id, username: user.username }.
function generateTokens(user) {
  // Hoàn thành tại đây
}

// 2. Viết hàm middleware `authenticateToken(req, res, next)`:
// - Lấy token từ Header `Authorization: Bearer <token>`.
// - Nếu không có token, trả về status 401 (Unauthorized).
// - Giải mã verify token bằng SECRET_KEY.
// - Nếu verify thất bại, trả về status 403 (Forbidden).
// - Nếu verify thành công, gán dữ liệu giải mã vào `req.user` và gọi `next()`.
function authenticateToken(req, res, next) {
  // Hoàn thành tại đây
}
