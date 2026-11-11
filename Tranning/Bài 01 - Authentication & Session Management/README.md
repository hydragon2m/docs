# BÀI 01: KIẾN TRÚC XÁC THỰC HIỆN ĐẠI (AUTHENTICATION ARCHITECTURE)
## Chuyên đề: JWT, Cookie, Cơ chế Trình duyệt, Stateless vs Stateful & Redis JTI

> **Tổng quan:** Bài học này được phân tách độc lập thành hai phần chuyên biệt: **Lý thuyết** (kiến thức nền tảng & kiến trúc) và **Thực hành** (mã nguồn mẫu & các bài lab thực nghiệm).

---

## 📂 MỤC LỤC BÀI HỌC

### 📚 PHẦN 1: LÝ THUYẾT NỀN TẢNG & KIẾN TRÚC (THEORY & ARCHITECTURE)
*Nằm tại thư mục:* [`01. Lý thuyết/`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/01.%20L%C3%BD%20thuy%E1%BA%BFt)

1. [**01. Bản chất JWT & Cấu trúc Claims.md**](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/01.%20L%C3%BD%20thuy%E1%BA%BFt/01.%20B%E1%BA%A3n%20ch%E1%BA%A5t%20JWT%20&%20C%E1%BA%A5u%20tr%C3%BAc%20Claims.md)
   * 3 thành phần cốt lõi: Header, Payload, Signature.
   * Tại sao JWT không phải là mã hóa bảo mật mà là bảo vệ tính toàn vẹn (Tamper-proof).
   * Các registered claims chuẩn (`sub`, `exp`, `iat`, `jti`).
2. [**02. Cookie & Cơ chế Trình duyệt Vận hành.md**](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/01.%20L%C3%BD%20thuy%E1%BA%BFt/02.%20Cookie%20&%20C%C6%A1%20ch%E1%BA%BF%20Tr%C3%ACnh%20duy%E1%BB%87t%20V%E1%BA%ADn%20h%C3%A0nh.md)
   * Trình duyệt quản lý Cookie Jar như thế nào.
   * 5 cờ an ninh sống còn: `HttpOnly`, `Secure`, `SameSite: Strict/Lax/None`, `Path`, `Max-Age`.
   * Cơ chế gửi cookie Cross-Origin: `credentials: 'include'` và cấu hình CORS Backend.
   * So sánh nơi lưu trữ: `localStorage` vs `HttpOnly Cookie`.
3. [**03. Stateless vs Stateful Authentication.md**](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/01.%20L%C3%BD%20thuy%E1%BA%BFt/03.%20Stateless%20vs%20Stateful%20Authentication.md)
   * Stateful (Session-based) truyền thống & nút thắt cổ chai khi Scale ngang.
   * Stateless (Pure JWT) & Nghịch lý chí mạng: Không thể thu hồi hoặc logout token trước hạn.
   * Bảng so sánh toàn diện 6 tiêu chí kỹ thuật.
4. [**04. Kiến trúc Lai Production (Dual Token, Redis & JTI Rotation).md**](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/01.%20L%C3%BD%20thuy%E1%BA%BFt/04.%20Ki%E1%BA%BFn%20tr%C3%BAc%20Lai%20Production%20(Dual%20Token,%20Redis%20&%20JTI%20Rotation).md)
   * Mô hình Hybrid: Access Token (15m, Stateless) + Refresh Token (7d, Stateful qua Redis với `jti`).
   * Cơ chế xoay vòng token (Token Rotation).
   * Phát hiện tấn công đánh cắp token (Replay Attack Detection) & Tự động hủy phiên.
   * Quản lý Single Logout vs Logout All Devices bằng lệnh `SCAN`.
5. [**05. Cheat-sheet & Câu hỏi Phỏng vấn Thực chiến.md**](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/01.%20L%C3%BD%20thuy%E1%BA%BFt/05.%20Cheat-sheet%20&%20C%C3%A2u%20h%E1%BB%8Fi%20Ph%E1%BB%8Fng%20v%E1%BA%A5n%20Th%E1%BB%B1c%20chi%E1%BA%BFn.md)
   * Bảng tổng hợp nhanh các khái niệm và câu hỏi phỏng vấn thực chiến.
   * 4 câu hỏi phỏng vấn Senior/Lead hóc búa kèm lời giải chuẩn.

---

### 💻 PHẦN 2: THỰC HÀNH TRIỂN KHAI & MÃ NGUỒN MẪU (PRACTICE & CODE SAMPLES)
*Nằm tại thư mục:* [`02. Thực hành/`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh)

1. [**Hướng dẫn thực hành & 4 Bài Lab trên lớp.md**](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/H%C6%B0%E1%BB%9Bng%20d%E1%BA%ABn%20th%E1%BB%B1c%20h%C3%A0nh%20&%204%20B%C3%A0i%20Lab%20tr%C3%AAn%20l%E1%BB%9Bp.md): Kịch bản dẫn dắt 4 bài lab thực nghiệm từng bước.
2. **Backend API NestJS (`backend-nestjs/`):**
   * [`src/main.ts`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/backend-nestjs/src/main.ts): CORS credentials, cookie-parser.
   * [`src/redis/redis.service.ts`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/backend-nestjs/src/redis/redis.service.ts): Thao tác Whitelist JTI & xóa session an toàn qua SCAN.
   * [`src/auth/auth.service.ts`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/backend-nestjs/src/auth/auth.service.ts): Ký token, JTI validation, Replay Attack Detection.
   * [`src/auth/auth.controller.ts`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/backend-nestjs/src/auth/auth.controller.ts): Set-Cookie `HttpOnly`, `SameSite=Lax`.
3. **Frontend Next.js (`frontend-nextjs/`):**
   * [`src/lib/api-client.ts`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/frontend-nextjs/src/lib/api-client.ts): Fetch client tự động mang Cookie & tự động Refresh Token khi gặp lỗi 401.
   * [`src/middleware.ts`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/frontend-nextjs/src/middleware.ts): Edge Middleware bảo vệ route.
   * [`src/app/login/page.tsx`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/frontend-nextjs/src/app/login/page.tsx) & [`src/app/dashboard/page.tsx`](file:///home/hy/Documents/Obsidian%20Vault/Tranning/B%C3%A0i%2001%20-%20Authentication%20&%20Session%20Management/02.%20Th%E1%BB%B1c%20h%C3%A0nh/frontend-nextjs/src/app/dashboard/page.tsx): Giao diện trực quan tích hợp Real-time Console Log.
