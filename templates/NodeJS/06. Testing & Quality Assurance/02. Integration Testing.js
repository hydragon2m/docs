// Bài tập 02: Integration & E2E Testing với Supertest
// Yêu cầu: Viết cấu trúc Integration Test cho một endpoint GET `/api/users/:id` đơn giản.

const express = require('express');
const app = express();

const mockUsers = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];

app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = mockUsers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.status(200).json(user);
});

module.exports = app;

// Yêu cầu: Hãy giả lập viết test file sử dụng `supertest` để test API trên:
// - Test case 1: Gọi thành công GET /api/users/1 trả về status 200 và user Alice.
// - Test case 2: Gọi thất bại GET /api/users/999 trả về status 404 và object error "User not found".
