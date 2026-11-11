Thư mục thực hành này chứa toàn bộ mã nguồn có thể chạy thực tế bao gồm:
* **Backend:** NestJS API tại thư mục [`backend-nestjs/`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/backend-nestjs) (Chạy cổng `4000`).
* **Frontend:** Next.js App Router tại thư mục [`frontend-nextjs/`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/frontend-nextjs) (Chạy cổng `3000`).

---

## I. CHUẨN BỊ MÔI TRƯỜNG KHỞI CHẠY (QUICK SETUP)

### Bước 1: Khởi động Redis
```bash
docker run -d --name redis-lab -p 6379:6379 redis:alpine
```

### Bước 2: Khởi động Backend (NestJS)
```bash
cd "Tranning/Bài 01 - Authentication & Session Management/02. Thực hành/backend-nestjs"
npm install
npm run start:dev
```
*(Server sẵn sàng nhận request tại: `http://localhost:4000`)*

### Bước 3: Khởi động Frontend (Next.js)
```bash
cd "Tranning/Bài 01 - Authentication & Session Management/02. Thực hành/frontend-nextjs"
npm install
npm run dev
```
*(Mở trình duyệt truy cập: `http://localhost:3000/login`)*

---

## II. 4 BÀI LAB THỰC NGHIỆM TRỰC TIẾP (HANDS-ON LABS)

### 🧪 LAB 1: Khám phá Cookie Jar & Cờ `HttpOnly` trên Trình duyệt

* **Mục tiêu:** Kiểm chứng JavaScript hoàn toàn bất lực trước Cookie có cờ `HttpOnly`.
* **Các bước thực hiện:**
  1. Truy cập `http://localhost:3000/login`.
  2. Đăng nhập với tài khoản:
     * Email: `admin@example.com`
     * Password: `Password123@`
  3. Bấm **F12** mở Chrome DevTools $\rightarrow$ Chọn tab **Application** $\rightarrow$ Mục **Storage** $\rightarrow$ **Cookies** $\rightarrow$ `http://localhost:3000`.
  4. **Quan sát các thông số:**
     * Tên cookie: `refreshToken`.
     * Cột `HttpOnly`: Có dấu tích xanh `✓`.
     * Cột `SameSite`: Đang là `Lax`.
  5. Chuyển sang tab **Console** của DevTools và gõ:
     ```javascript
     console.log("Cookie đọc bằng JS:", document.cookie);
     ```
  6. **Kết quả quan sát:** Biến `document.cookie` hoàn toàn rỗng hoặc không có `refreshToken`.
  7. **Kết luận:** Dù kẻ tấn công có chèn được mã độc XSS vào website thì cũng **không thể trích xuất được Refresh Token**!

---

### 🧪 LAB 2: Soi Whitelist Session & `jti` bên trong RAM của Redis

* **Mục tiêu:** Kiểm chứng cách Redis lưu trữ mã định danh `jti` trong RAM để kiểm soát phiên.
* **Các bước thực hiện:**
  1. Mở Terminal và kết nối vào Redis CLI:
     ```bash
     docker exec -it redis-lab redis-cli
     ```
  2. Liệt kê các session đang online:
     ```bash
     KEYS session:*
     ```
     *(Kết quả: `session:usr_998877:NextJS_Chrome_Client`)*
  3. Đọc giá trị bên trong key:
     ```bash
     GET session:usr_998877:NextJS_Chrome_Client
     ```
     *(Kết quả: Một chuỗi UUID như `3fa85f64-5717-4562-b3fc-2c963f66afa6`)*
  4. Kiểm tra thời gian sống (TTL) của phiên:
     ```bash
     TTL session:usr_998877:NextJS_Chrome_Client
     ```
     *(Kết quả: ~`604800` giây = 7 ngày)*
  5. **Kết luận:** Refresh Token có thể sống 7 ngày, nhưng sinh mệnh của nó hoàn toàn nằm trong quyền kiểm soát của Redis.

---

### 🧪 LAB 3: Thực nghiệm Tự động Làm mới Phiên (Silent Refresh)

* **Mục tiêu:** Tận mắt quan sát luồng Interceptor tự động bắt lỗi `401 Unauthorized` và refresh token ngầm mà không làm gián đoạn trải nghiệm người dùng.
* **Các bước thực hiện:**
  1. Mở file mã nguồn Backend [`auth.service.ts`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/backend-nestjs/src/auth/auth.service.ts).
  2. Sửa tạm thời thời gian sống của Access Token thành 10 giây:
     ```typescript
     private readonly ACCESS_TOKEN_TTL = '10s'; // Chỉnh thành 10 giây để test
     ```
  3. Đăng nhập lại trên web, chuyển sang trang `/dashboard`.
  4. Mở tab **Network** của DevTools.
  5. Đợi 12 giây trôi qua để Access Token hết hạn, sau đó bấm nút: **"1. Gọi API Protected (/profile)"**.
  6. **Quan sát Network Tab:**
     * Request 1: `GET /auth/profile` $\rightarrow$ Trả về mã đỏ **`401 Unauthorized`**.
     * Request 2: Ngay lập tức có một request ngầm tự động kích hoạt: `POST /auth/refresh` $\rightarrow$ Trả về **`200 OK`** kèm Access Token mới toanh.
     * Request 3: Request `GET /auth/profile` được tự động gửi lại lần thứ hai $\rightarrow$ Trả về **`200 OK`**.
  7. **Kết luận:** Người dùng không bị đá văng ra màn hình đăng nhập, giao diện mượt mà tuyệt đối!

---

### 🧪 LAB 4: Thực nghiệm Phát hiện Tấn công Tái sử dụng Token (Replay Attack)

* **Mục tiêu:** Tái hiện kịch bản Hacker đánh cắp được token cũ và xem cơ chế tự vệ của hệ thống kích hoạt như thế nào.
* **Các bước thực hiện:**
  1. Trên trang `/dashboard`, bấm nút **"2. Thủ công Refresh Token (Rotate)"**.
     * Lúc này hệ thống đã xoay token: `jti_1` cũ đã bị hủy, `jti_2` mới đang có hiệu lực trong Redis.
  2. Giả lập vai trò Hacker: Mở Postman hoặc một tab Terminal riêng, lấy chuỗi Refresh Token cũ (`jti_1`) vừa lưu ban nãy và gửi request thủ công lên Backend:
     ```bash
     curl -X POST http://localhost:4000/auth/refresh \
       -H "Cookie: refreshToken=<TOKEN_CŨ_JTI_1>" \
       -H "Content-Type: application/json"
     ```
  3. **Quan sát Terminal của NestJS:**
     * Console Backend sẽ in cảnh báo an ninh màu đỏ:
       ```text
       🚨 [SECURITY ALERT] Phát hiện Refresh Token bị sử dụng lại cho User: usr_998877!
       Token JTI gửi lên: jti_1, JTI hiện tại trong Redis: jti_2.
       HỦY TOÀN BỘ PHIÊN CỦA USER NGAY LẬP TỨC!
       ```
  4. Quay lại trình duyệt và kiểm tra Redis:
     ```bash
     KEYS session:*
     ```
     *(Kết quả: Không còn key nào tồn tại! Toàn bộ phiên của user đã bị xóa sạch).*
  5. Người dùng thật bấm bất kỳ nút nào trên web $\rightarrow$ Bị đá về trang `/login` ngay lập tức.
  6. **Kết luận:** Đây là chuẩn mực an ninh cao nhất của OWASP và OAuth 2.0 dành cho Single Page Applications (SPAs).
