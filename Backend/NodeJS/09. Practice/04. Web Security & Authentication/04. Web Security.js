// Bài tập 04: Web Security (CORS & Helmet)
// Yêu cầu: Viết một Express app cấu hình Helmet bảo mật và giới hạn CORS whitelist.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// 1. Tích hợp Helmet middleware.
// 
// 2. Cấu hình CORS middleware:
// - Chỉ cho phép origin duy nhất là "https://learn-nestjs.com".
// - Cho phép truyền credentials (cookie).

// Hoàn thành cấu hình tại đây
