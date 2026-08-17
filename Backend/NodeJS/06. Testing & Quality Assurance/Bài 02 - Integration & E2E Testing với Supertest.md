## I. KHÁI QUÁT (OVERVIEW)

### 1. Sự khác biệt: Integration Testing vs Unit Testing
Trong khi **Unit Testing** băm nhỏ code và mock mọi thứ, **Integration Testing (Kiểm thử tích hợp)** và **E2E Testing (Kiểm thử đầu cuối)** cho phép chúng ta kiểm tra sự vận hành thực tế của toàn bộ các bánh răng trong hệ thống:
* Request HTTP thực tế đi qua Router.
* Kích hoạt middleware kiểm tra bảo mật (Auth JWT, CORS).
* Đi vào Controller xử lý logic ở Service.
* Ghi dữ liệu thực tế vào **Database thử nghiệm (Test Database)**.

---

### 2. Thư viện Supertest là gì?
**Supertest** là thư viện tiêu chuẩn dùng để kiểm thử các máy chủ HTTP trong Node.js. 
* **Điểm vượt trội:** Supertest cho phép bạn bắn các request HTTP ảo (GET, POST...) thẳng vào thực thể Server Node.js (Express/NestJS) mà **không cần chạy lệnh `listen` ràng buộc server vào một cổng mạng thực tế (port)** của hệ điều hành. Việc này giúp chạy test cực kỳ nhanh và tránh lỗi trùng port.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Quản lý vòng đời kiểm thử (Test Lifecycle Hooks)

Khi viết Integration Test giao tiếp với DB thật, bạn phải quản lý dữ liệu chặt chẽ để các test case không làm ảnh hưởng lẫn nhau. Jest cung cấp các hàm móc vòng đời:

* **`beforeAll(fn)`**: Chạy **duy nhất 1 lần** trước khi tất cả các test case bắt đầu (thường dùng để kết nối Database thử nghiệm, chạy migrations tạo bảng).
* **`afterAll(fn)`**: Chạy **duy nhất 1 lần** sau khi tất cả các test case đã chạy xong (thường dùng để dọn dẹp bảng dữ liệu, đóng kết nối Database).
* **`beforeEach(fn)`**: Chạy trước **mỗi** test case đơn lẻ (thường dùng để reset dữ liệu trong bảng về trạng thái sạch).

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy cùng thiết kế một file Integration Test hoàn chỉnh kiểm tra luồng API Đăng ký tài khoản (`POST /register`) bằng Express và Supertest:

### File Code Server cần test (`app.js`):
```javascript
const express = require('express');
const app = express();
app.use(express.json());

// Cơ sở dữ liệu giả lập ở bộ nhớ tạm (In-memory DB)
const usersDB = [];

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  
  const userExists = usersDB.find(u => u.username === username);
  if (userExists) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const newUser = { id: usersDB.length + 1, username };
  usersDB.push(newUser);
  res.status(201).json(newUser);
});

// ⚠️ LƯU Ý: Export thực thể app, KHÔNG gọi app.listen() ở đây!
module.exports = app;
```

### File viết Test (`app.test.js`):
```javascript
const request = require('supertest');
const app = require('./app'); // Nạp thực thể Express App

describe('API Integration Test - POST /api/register', () => {

  test('Phải đăng ký tài khoản thành công với thông tin hợp lệ', async () => {
    // Gửi request POST ảo qua Supertest
    const response = await request(app)
      .post('/api/register')
      .send({
        username: "newuser",
        password: "securepassword123"
      });

    // Kiểm tra mã trạng thái HTTP trả về
    expect(response.statusCode).toBe(201);
    
    // Kiểm tra cấu trúc body JSON trả về
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe("newuser");
  });

  test('Phải trả về lỗi 400 nếu thiếu trường thông tin', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        username: "onlyusername" // Thiếu password
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Missing fields");
  });
});
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy ô nhiễm dữ liệu giữa các Test Cases (Data Pollution)
> Khi chạy Integration Test ghi dữ liệu thật vào DB, nếu Test Case 1 tạo ra một user tên là `testuser`, và Test Case 2 cũng tạo tiếp user tên `testuser`, Test Case 2 sẽ bị lỗi trùng khóa chính (Duplicate Key) và thất bại.
>
> **Quy tắc cốt lõi:**
> - Luôn chạy lệnh xóa dữ liệu (ví dụ: `TRUNCATE TABLE users;`) trong hàm `beforeEach()` hoặc `afterEach()` để đảm bảo mỗi test case đều được thực thi trên một Database hoàn toàn sạch sẽ.
> - Tuyệt đối không dùng chung Database phát triển (Development DB) làm Database kiểm thử. Hãy cấu hình một DB test riêng biệt.

> [!IMPORTANT]
> ### 2. Kiểm thử API có bảo mật (Authenticated Endpoints)
> Đối với các API yêu cầu đăng nhập (Authorization Bearer JWT), trước khi chạy test, bạn phải thực hiện bước giả lập đăng nhập để lấy chuỗi Token, sau đó dùng Supertest đính kèm Token đó vào header:
> ```javascript
> const token = "jwt_token_here";
> const response = await request(app)
>   .get('/api/profile')
>   .set('Authorization', `Bearer ${token}`); // Đính kèm header token
> ```
