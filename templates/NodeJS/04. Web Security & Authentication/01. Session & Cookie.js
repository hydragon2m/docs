// Bài tập 01: Cookie & Session
// Yêu cầu: Viết code thiết lập Cookie an toàn bằng Express.

const express = require('express');
const app = express();

// 1. Hãy hoàn thành endpoint `/set-session`:
// - Thiết lập một Cookie tên là `user_session` chứa chuỗi mã ngẫu nhiên.
// - Cookie bắt buộc phải được cấu hình: HttpOnly: true, Secure: true (giả lập), SameSite: 'lax', maxAge: 1 giờ.
app.get('/set-session', (req, res) => {
  // Viết code thiết lập cookie tại đây
  res.send("Session cookie set!");
});

// 2. Viết endpoint `/get-session`:
// - Đọc cookie `user_session` truyền lên từ trình duyệt và trả về nội dung cho Client.
app.get('/get-session', (req, res) => {
  // Gợi ý: dùng req.headers.cookie hoặc thư viện cookie-parser để đọc
  res.send("Read session!");
});

// app.listen(3000);
