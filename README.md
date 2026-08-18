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

### Cách làm bài tập thực hành:
1.  **Cài đặt Node.js & TypeScript** trên máy cá nhân để chạy code:
    ```bash
    # Khởi tạo dependencies (nếu có package.json)
    npm install
    ```
2.  Mở các file trong thư mục `09. Practice/` bằng IDE của bạn (như VS Code / WebStorm).
3.  Tìm các ký tự comment `// TODO` trong code và hoàn thiện logic lập trình theo yêu cầu đề bài.
4.  Chạy thử file code để kiểm tra kết quả:
    ```bash
    # Sử dụng ts-node để chạy trực tiếp file TypeScript
    npx ts-node path/to/practice/file.ts
    ```
5.  Sau khi hoàn thành và vượt qua toàn bộ kịch bản kiểm thử (Test Scenario) ở cuối file, bạn đã sẵn sàng bước sang bài tiếp theo!

---

*Chúc bạn có một hành trình học tập tuyệt vời và trở thành một Backend Engineer chuyên nghiệp!* 💻🚀
