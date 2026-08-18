# 🚀 Lộ Trình Học Backend Chuyên Sâu (TypeScript → NestJS Mastery)

Chào mừng bạn đến với kho lưu trữ tài liệu và bài tập thực hành lộ trình học **Backend Masterclass**. Kho dữ liệu này được thiết kế tối ưu nhất khi đọc bằng ứng dụng **Obsidian** (hỗ trợ hiển thị sơ đồ kiến trúc Mermaid, liên kết bài học chéo, và các ghi chú cảnh báo trực quan).

---

## 📥 1. Hướng dẫn Cài đặt & Mở bài học trên Obsidian

### Bước 1: Tải và cài đặt Obsidian
*   **Windows / macOS:** Truy cập trang chủ [Obsidian.md](https://obsidian.md/) để tải bản cài đặt tương ứng.
*   **Linux:**
    *   Cài đặt qua Flatpak: `flatpak install flathub md.obsidian.Obsidian`
    *   Hoặc tải file AppImage trực tiếp từ trang chủ Obsidian.

### Bước 2: Clone kho lưu trữ này về máy
Mở Terminal trên máy của bạn và chạy lệnh sau để tải kho tài liệu về:
```bash
git clone <URL_REPOSITOY_CỦA_BẠN> "Obsidian Vault"
```

### Bước 3: Mở thư mục dưới dạng Obsidian Vault
1.  Khởi động ứng dụng **Obsidian**.
2.  Chọn **"Open folder as vault"** (Mở thư mục dưới dạng Vault).
3.  Tìm và chọn thư mục `Obsidian Vault` mà bạn vừa clone về.
4.  Giao diện bài học trực quan sẽ xuất hiện ở thanh Sidebar bên trái.

---

## 📂 2. Cấu trúc Lộ trình học (Course Map)

Thư mục `Backend/` được phân chia thành các Module học tập cốt lõi từ cơ bản đến nâng cao:

*   **`TS/` (TypeScript Mastery):** Nắm vững hệ thống kiểu dữ liệu từ cơ bản đến nâng cao (Generics, Type Manipulation, Compiler options).
*   **`NodeJS/` (Node.js Core & Internals):** Hiểu sâu về V8 Engine, Event Loop, libuv, Worker Threads, CPU/Memory Profiling, Error Handling và Web Security.
*   **`Database & ORM/` (Cơ sở dữ liệu & ORM):** Deep dive PostgreSQL (MVCC, Indexing), MongoDB, Redis (Caching, Distributed Lock, Lua scripts) và cú pháp TypeORM/Prisma chuyên sâu.
*   **`DevOps & Architecture/` (Kiến trúc & Triển khai):** Docker, Monolithic vs Microservices, API Gateway, Message Brokers (RabbitMQ/Kafka), Nginx Reverse Proxy, Load Balancing và CI/CD với GitHub Actions.
*   **`NestJS/` (NestJS Framework):** Làm chủ framework chuẩn doanh nghiệp với Core DI Container, Request Lifecycle, ORM Integration, BullMQ Queue và WebSockets Gateway.
*   **`Observability & Security/` (Giám sát & Bảo mật):** Ghi log cấu trúc Pino, Correlation ID, truy vết phân tán OpenTelemetry, Prometheus Metrics, Grafana Dashboards và API Hardening chống OWASP Top 10.

---

## 📝 3. Phương pháp Học & Làm Bài tập (Practice Guide)

Khóa học tuân thủ nghiêm ngặt nguyên lý: **"Học đi đôi với hành - Pass bài tập mới mở bài mới"**.

### Cấu trúc bài tập
Trong mỗi thư mục Module lớn đều có một thư mục **`09. Practice/`** chứa các file code bài tập TypeScript/SQL/YAML tương ứng với từng bài lý thuyết.

### Hướng dẫn sử dụng CLI Tool tự động (`npm run study`):
Chúng tôi đã xây dựng một CLI script giúp tự động hóa quá trình mở bài học, làm bài tập và kiểm thử:

1.  **Cài đặt các thư viện cần thiết (Chỉ cần chạy 1 lần đầu tiên):**
    ```bash
    npm install
    ```
2.  **Xem tiến trình học tập hiện tại:**
    ```bash
    npm run study
    # hoặc: node study.js status
    ```
    Lệnh này sẽ liệt kê danh sách toàn bộ các bài học trong lộ trình và đánh dấu bài đang học hiện tại.
3.  **Khởi tạo hoặc kiểm thử bài học hiện tại:**
    ```bash
    npm run study next
    ```
    *   *Lần chạy đầu tiên của bài:* Lệnh này sẽ tự động copy file mẫu `.template` thành file bài làm thực tế (ví dụ: `.ts` hoặc `.js`) nằm trong thư mục `09. Practice/` tương ứng và hiển thị đường dẫn cho bạn.
    *   *Sau khi bạn làm xong bài:* Chạy lại lệnh này để tự động chạy kiểm thử bài làm của bạn. Nếu tất cả kịch bản kiểm thử (Test Scenario) đều **PASS**, nó sẽ đánh dấu bài đó hoàn thành và tự động khởi tạo bài mới tiếp theo cho bạn!
4.  **Kiểm thử nhanh bài làm hiện tại:**
    ```bash
    npm run study test
    ```
    Chạy thử bài làm hiện tại để kiểm tra xem logic của bạn có chính xác không mà không chuyển bài.

---

*Chúc bạn có một hành trình học tập tuyệt vời và trở thành một Backend Engineer chuyên nghiệp!* 💻🚀
