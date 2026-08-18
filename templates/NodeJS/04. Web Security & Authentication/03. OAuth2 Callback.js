// Bài tập 03: OAuth2 Callback Handler
// Yêu cầu: Viết API callback nhận auth code từ Google và thực hiện đổi lấy Token.

const express = require('express');
const axios = require('axios');
const app = express();

// Giả lập endpoint Callback nhận redirect từ Google:
// - Lấy mã `code` từ query string (req.query.code).
// - Nếu không có code, trả về lỗi 400.
// - Viết request POST gửi lên https://oauth2.googleapis.com/token để đổi code lấy token (như lý thuyết Bài 03).
// - Trả về dữ liệu Token thu được cho Client.

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  // Thực hiện đổi code lấy token tại đây
  res.send("OAuth Callback handler template");
});
