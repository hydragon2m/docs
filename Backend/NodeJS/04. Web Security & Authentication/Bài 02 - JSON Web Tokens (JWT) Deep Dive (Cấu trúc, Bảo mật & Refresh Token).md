## I. KHÁI QUÁT (OVERVIEW)

### 1. JSON Web Token (JWT) là gì?
**JSON Web Token (JWT)** là một tiêu chuẩn mở (RFC 7519) định nghĩa một cách nhỏ gọn và an toàn để truyền thông tin giữa các bên dưới dạng một đối tượng JSON. 

Thông tin này có thể được kiểm chứng và đáng tin cậy vì nó được **ký kỹ thuật số (digitally signed)**. JWT có thể được ký bằng một khóa bí mật đối xứng (HMAC algorithm) hoặc một cặp khóa công khai/riêng tư bất đối xứng (RSA hoặc ECDSA).

---

### 2. Cấu trúc của một JWT
Một chuỗi JWT hoàn chỉnh bao gồm 3 phần được phân tách với nhau bằng dấu chấm (`.`): `Header.Payload.Signature`

```text
  ┌────────────────────────────────────────────────────────┐
  │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9                   │ ◄─── 1. Header (Thuật toán ký)
  │ .                                                      │
  │ eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0    │ ◄─── 2. Payload (Dữ liệu người dùng)
  │ .                                                      │
  │ SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c            │ ◄─── 3. Signature (Chữ ký xác thực)
  └────────────────────────────────────────────────────────┘
```

#### a. Header (Tiêu đề)
Chứa thông tin về kiểu token (thường là JWT) và thuật toán mã hóa được sử dụng (ví dụ: HS256 hoặc RS256).
* *Ví dụ sau khi decode:* `{"alg": "HS256", "typ": "JWT"}`

#### b. Payload (Dữ liệu truyền tải)
Chứa các khai báo (**Claims**). Claims là các thông tin về đối tượng (ví dụ: thông tin người dùng) và các metadata bổ sung. Có 3 loại claims:
* **Registered claims:** Các trường tiêu chuẩn được định nghĩa sẵn như `iss` (issuer), `sub` (subject), `exp` (expiration time), `iat` (issued at).
* **Public/Private claims:** Các trường tự định nghĩa theo nhu cầu của ứng dụng (ví dụ: `userId`, `role`).
* *Ví dụ sau khi decode:* `{"sub": "101", "name": "Alice", "role": "admin", "exp": 1790000000}`

#### c. Signature (Chữ ký)
Là phần quan trọng nhất giúp ngăn chặn việc giả mạo Token. Nó được tạo ra bằng cách lấy phần Header đã mã hóa Base64Url kết hợp với phần Payload đã mã hóa Base64Url, sau đó ký bằng một khóa bí mật (Secret Key) thông qua thuật toán được khai báo ở Header.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Cơ chế hoạt động của Refresh Token Pattern

Vì JWT là Stateless, Server không thể chủ động thu hồi (revoke) Token trước khi nó hết hạn. Nếu hacker lấy trộm được Access Token của người dùng, chúng có quyền truy cập hệ thống cho đến khi Token đó hết hạn. 

Để giảm thiểu rủi ro này, chúng ta sử dụng thiết kế **Refresh Token Pattern**:

```text
  [Client]                                                        [Server]
     │                                                               │
     ├────────── 1. Gửi Access Token hết hạn ───────────────────────►│ (Từ chối - 401 Unauthorized)
     │                                                               │
     ├────────── 2. Gửi Refresh Token tới endpoint /refresh ────────►│ (Kiểm tra trong Database/Redis)
     │                                                               │
     │◄───────── 3. Cấp cặp Token mới (Access Token + Refresh Token)─┤ (Cập nhật Token mới trong DB)
```

1. **Access Token (Thời hạn ngắn - e.g. 15 phút):** Được đính kèm vào tất cả các Request gọi API. Vì thời hạn rất ngắn, nếu bị lộ thì thiệt hại cũng sẽ nhanh chóng kết thúc.
2. **Refresh Token (Thời hạn dài - e.g. 7 ngày):** Chỉ được gửi lên endpoint `/refresh` để xin cấp lại Access Token mới khi Access Token cũ hết hạn. 
   * **Cơ chế lưu trữ:** Khác với Access Token, Refresh Token **bắt buộc phải được lưu trữ trong Database/Redis** trên Server để quản lý.
   * **Xóa quyền truy cập (Revoke):** Khi người dùng đổi mật khẩu hoặc bấm nút Log out, Server xóa bản ghi Refresh Token đó trong Database. Lần tiếp theo Client gửi Refresh Token đó lên, Server từ chối và ép buộc đăng nhập lại.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy xem cách viết code tạo và xác thực JWT bằng thư viện chuyên dụng **`jsonwebtoken`**:

```javascript
const jwt = require('jsonwebtoken');

const SECRET_KEY = "super_secret_key_dont_share";

// 1. Tạo Access Token (Thời hạn 15 phút)
const payload = { userId: 101, role: "editor" };
const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: '15m' });
console.log("Access Token được tạo:", accessToken);

// 2. Giải mã và Xác thực Token gửi lên từ Client
try {
  const decoded = jwt.verify(accessToken, SECRET_KEY);
  console.log("Giải mã thành công dữ liệu:", decoded);
  // Output: { userId: 101, role: 'editor', iat: ..., exp: ... }
} catch (error) {
  console.error("Xác thực thất bại (Token hết hạn hoặc bị sửa đổi):", error.message);
}
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy để lộ thông tin nhạy cảm ở Payload
> Một sai lầm kinh điển của người mới học là nghĩ rằng JWT được mã hóa bảo mật nên nhét mật khẩu (password) hay thông tin thẻ tín dụng của người dùng vào phần Payload.
> 
> **Sự thật:** Phần Header và Payload của JWT chỉ được mã hóa dạng **Base64Url** (đây là giải thuật chuyển đổi ký tự chứ **không phải giải thuật mã hóa bảo mật**). Bất kỳ ai có chuỗi JWT cũng có thể decode và đọc được 100% nội dung Payload dạng chữ thường chỉ sau 1 dòng code.
>
> **Quy tắc cốt lõi:** Tuyệt đối không nhét thông tin nhạy cảm (mật khẩu, token bên thứ ba) vào Payload của JWT. Chỉ lưu trữ các định danh như `userId`, `role` hoặc `username`.

> [!WARNING]
> ### 2. Thuật toán "none" Vulnerability (Lỗ hổng thuật toán rỗng)
> Trong các phiên bản thư viện cũ, nếu kẻ tấn công sửa đổi phần Header của JWT thành `{"alg": "none"}` và xóa bỏ chữ ký Signature, một số thư viện xác thực sẽ ngây thơ chấp nhận Token này là hợp lệ.
>
> **Quy tắc cốt lõi:** Luôn cập nhật thư viện `jsonwebtoken` bản mới nhất và cấu hình ép buộc kiểm tra thuật toán rõ ràng khi xác thực: `jwt.verify(token, secret, { algorithms: ['HS256'] })`.
