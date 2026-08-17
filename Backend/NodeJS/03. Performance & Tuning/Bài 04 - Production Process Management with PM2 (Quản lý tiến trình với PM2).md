## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần một Process Manager ở Production?
Khi bạn chạy Server Node.js bằng lệnh `node server.js` ở Terminal:
* Nếu bạn tắt Terminal, Server sẽ dừng hoạt động.
* Nếu code gặp lỗi bất ngờ (ví dụ: lỗi DB không bắt được uncaughtException) và bị crash, Server sẽ dừng hoạt động luôn và người dùng không thể truy cập được nữa.

Ở môi trường Production, ứng dụng của bạn bắt buộc phải hoạt động **24/7/365** và có khả năng tự động hồi sinh nếu có sự cố. **PM2 (Process Manager 2)** là công cụ quản lý tiến trình tiêu chuẩn doanh nghiệp chuyên dụng dành cho Node.js để giải quyết các bài toán vận hành này.

---

### 2. Các tính năng cốt lõi của PM2
* **Tự động hồi sinh (Auto Restart):** Theo dõi tiến trình và khởi động lại ngay lập tức nếu Server bị crash.
* **Chạy ngầm (Daemon Mode):** Quản lý ứng dụng chạy ẩn dưới nền hệ thống của hệ điều hành.
* **Chế độ Cluster tự động:** Nhân bản Server tận dụng tối đa nhân CPU chỉ bằng 1 dòng lệnh mà không cần sửa code.
* **Tải lại không gián đoạn (Zero-downtime Reload):** Cập nhật code mới mà không làm mất bất kỳ kết nối nào của người dùng.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. File cấu hình chuyên nghiệp: `ecosystem.config.js`

Để quản lý ứng dụng chuẩn hóa, chúng ta tạo một file cấu hình tập trung thay vì gõ lệnh thủ công:

```javascript
module.exports = {
  apps: [
    {
      name: "my-nestjs-app",
      script: "./dist/main.js",          // File chạy chính (sau khi build sang JS)
      instances: "max",                   // Tự động tạo số lượng worker bằng số nhân CPU tối đa
      exec_mode: "cluster",               // Kích hoạt chế độ Cluster chia sẻ cổng mạng
      watch: false,                       // Không bật watch ở Production để tránh reload thừa
      max_memory_restart: "1G",           // Tự động khởi động lại worker nếu RAM vượt quá 1GB (chống OOM)
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "./logs/err.log",       // Đường dẫn lưu file log lỗi
      out_file: "./logs/out.log",         // Đường dẫn lưu file log thông tin
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
```

---

### 2. Các lệnh vận hành PM2 quan trọng

```bash
# Khởi chạy ứng dụng theo file cấu hình
pm2 start ecosystem.config.js

# Xem danh sách trạng thái các tiến trình đang chạy
pm2 list

# Xem bảng giám sát thời gian thực về RAM, CPU và số lượng Request
pm2 monit

# Xem log trực tiếp của ứng dụng
pm2 logs

# Lưu danh sách ứng dụng hiện tại để tự động chạy lại khi Server vật lý khởi động lại (Reboot)
pm2 save
pm2 startup
```

---

### 3. Khác biệt cốt lõi: `pm2 restart` vs `pm2 reload`

Khi bạn cập nhật code mới lên Server Production, việc cập nhật không được gây gián đoạn trải nghiệm của người dùng:

* **`pm2 restart [id]` (Gây gián đoạn - Downtime):** PM2 lập tức giết chết (kill) tất cả các Worker hiện tại cùng một lúc, sau đó mới khởi động lại. Trong khoảng vài giây khởi động, người dùng gọi vào Server sẽ nhận lỗi **502 Bad Gateway**.
* **`pm2 reload [id]` (Không gián đoạn - Zero-downtime):** PM2 sẽ thực hiện cơ chế cập nhật cuốn chiếu (Rolling Update). Nó khởi động Worker mới trước, đợi Worker mới online rồi mới tắt Worker cũ đi, tuần tự từng cái một. Hệ thống luôn luôn có Worker hoạt động để phục vụ người dùng.

---

### 4. Tắt nguồn êm ái (Graceful Shutdown) trong Node.js

Khi PM2 gọi lệnh `reload` hoặc tắt ứng dụng, nó sẽ gửi tín hiệu **`SIGINT`** tới tiến trình Node.js. 

Mặc định Node.js sẽ tắt ngay lập tức. Để tắt êm ái, code Node.js của bạn cần lắng nghe sự kiện này để **hoàn thành nốt các Request đang chạy dở** và **đóng an toàn các kết nối Database Connection Pools** trước khi thoát:

```javascript
process.on('SIGINT', () => {
  console.log('Nhận được tín hiệu tắt từ PM2. Đang thực hiện tắt êm ái (Graceful Shutdown)...');
  
  // 1. Ngăn không cho Server HTTP nhận thêm kết nối mới
  server.close(() => {
    console.log('Đã đóng hoàn toàn các kết nối HTTP active.');
    
    // 2. Đóng kết nối Database
    database.closePool().then(() => {
      console.log('Đã đóng an toàn Connection Pool của Database.');
      process.exit(0); // Thoát tiến trình thành công an toàn
    });
  });
  
  // Tự động ép buộc thoát sau 10 giây nếu các tác vụ trên bị kẹt
  setTimeout(() => {
    console.error('Ép buộc thoát tiến trình do quá thời gian chờ.');
    process.exit(1);
  }, 10000);
});
```
*Lưu ý:* PM2 sẽ đợi tối đa 1600ms (có thể chỉnh sửa bằng `kill_timeout` trong file cấu hình) trước khi gửi tín hiệu ép buộc tắt `SIGKILL` nếu tiến trình không chịu tự thoát.
