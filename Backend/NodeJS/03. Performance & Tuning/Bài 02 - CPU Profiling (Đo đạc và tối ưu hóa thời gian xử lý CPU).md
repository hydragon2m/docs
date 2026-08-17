## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần CPU Profiling?
Khi ứng dụng Node.js của bạn chạy chậm hoặc chiếm 100% dung lượng CPU trên Production, bạn không thể chỉ đoán mò xem dòng code nào đang gây ra vấn đề.

**CPU Profiling** là quá trình chụp và đo lường thời gian CPU tiêu tốn cho từng hàm cụ thể trong mã nguồn JavaScript. Kết quả của CPU Profile giúp bạn xác định chính xác **nút thắt cổ chai hiệu năng (Performance Bottleneck)** - nơi một hàm nhỏ nhưng chạy quá chậm hoặc được gọi quá nhiều lần làm nghẽn toàn bộ Event Loop.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Các phương pháp thu thập CPU Profile trong Node.js

#### a. Sử dụng cờ `--prof` tích hợp sẵn của V8
Đây là phương pháp nhẹ nhất, không cần cài đặt thêm thư viện và phù hợp cho cả môi trường máy chủ.

* **Bước 1: Chạy ứng dụng với cờ `--prof`:**
  ```bash
  node --prof server.js
  ```
  Khi chạy, V8 sẽ ghi nhận liên tục các mẫu thực thi của CPU và xuất ra một file log dạng `isolate-0xnnnnnnnn-v8.log` trong thư mục.

* **Bước 2: Phân tích file log thành báo cáo dễ đọc:**
  Vì file log thô rất khó đọc, bạn dùng công cụ dịch của Node.js để chuyển thành file text báo cáo:
  ```bash
  node --prof-process isolate-0xnnnnnnnn-v8.log > profile_report.txt
  ```
  Trong file `profile_report.txt`, bạn tìm phần `[JavaScript]` để xem danh sách các hàm ngốn CPU nhiều nhất.

---

#### b. Giám sát thời gian thực bằng Chrome DevTools (Cờ `--inspect`)
Nếu bạn muốn quan sát trực quan bằng giao diện đồ họa:

* **Bước 1: Chạy Server ở chế độ debug:**
  ```bash
  node --inspect server.js
  ```
* **Bước 2: Kết nối Chrome DevTools:**
  Mở trình duyệt Google Chrome, truy cập địa chỉ `chrome://inspect`. Click vào nút **"Inspect"** tương ứng với tiến trình Node.js đang chạy.
* **Bước 3: Ghi Profile:**
  Vào tab **Profiler**, click **Start** để bắt đầu ghi, thực hiện gửi request tải lên Server, sau đó click **Stop** để xem báo cáo.

---

### 2. Cách đọc biểu đồ ngọn lửa (Flamegraphs)

Khi phân tích CPU Profile bằng Chrome DevTools hoặc các công cụ nâng cao như `clinic.js`, bạn sẽ được xem một biểu đồ dạng ngọn lửa (Flamegraph):

```text
  [Hàm D] ───► Ngốn thời gian của CPU nhiều nhất (Đỉnh ngọn lửa)
  [Hàm C]
  [Hàm B]
  [Hàm A (Hàm Gốc)]
  ───────────────────────────────────────► Trục X: Chiều rộng thể hiện tổng thời gian CPU xử lý
```

* **Trục Y (Chiều cao):** Thể hiện **Call Stack Depth (Độ sâu của ngăn xếp cuộc gọi)**. Hàm nằm ở trên được gọi bởi hàm nằm ở dưới.
* **Trục X (Chiều rộng):** Thể hiện **Tổng thời gian CPU tiêu tốn** cho hàm đó (bao gồm cả các hàm con của nó).
* **Quy tắc tìm lỗi:** Hãy tìm các hàm có **chiều ngang cực rộng và nằm ở phía trên cùng** của một nhánh ngọn lửa. Đó chính là hàm đang chạy chậm nhất và trực tiếp gây nghẽn CPU.

---

## III. VÍ DỤ MINH HỌA VÀ ĐO ĐẠC THỰC TẾ (BENCHMARKING)

Để giả lập môi trường thực tế, trước khi đo đạc CPU, chúng ta sử dụng công cụ **`autocannon`** để bắn tải (DDoS giả lập) mô phỏng hàng nghìn request gọi vào Server:

```bash
# Cài đặt công cụ bắn tải
npm install -g autocannon

# Chạy Server Node.js của bạn
node server.js

# Bắn tải giả lập: 100 kết nối đồng thời trong vòng 5 giây
autocannon -c 100 -d 5 http://localhost:3000
```

Trong lúc `autocannon` đang bắn tải, hãy thực hiện ghi CPU Profile bằng Chrome DevTools để ghi nhận chính xác trạng thái chịu tải cao của Server.

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Chi phí hiệu năng khi bật Profiling (Overhead)
> Việc ghi CPU Profile yêu cầu V8 phải liên tục tạm dừng luồng chính ở tần suất cao (thường là 1ms/lần) để lấy mẫu Call Stack. Thao tác này sẽ làm giảm khoảng 10% - 30% hiệu năng thực tế của Server.
> 
> **Quy tắc cốt lõi:** Tuyệt đối không bật cờ `--inspect` hoặc chạy chế độ Profiling liên tục trên Production. Chỉ bật tạm thời khi cần thiết (ad-hoc debugging) hoặc thực hiện giả lập trên môi trường Staging/UAT.

> [!TIP]
> ### 2. Sử dụng thư viện Clinic.js của Node.js Team
> Để phân tích hiệu năng toàn diện (bao gồm CPU, Event Loop, I/O Delay) và tự động vẽ ra Flamegraph tuyệt đẹp, hãy sử dụng công cụ **`clinic`** do NearForm phát triển:
> ```bash
> npm install -g clinic
> clinic flame -- node server.js
> ```
> Sau khi bạn tắt server, Clinic.js sẽ tự động mở một file HTML chứa biểu đồ ngọn lửa tương tác cực kỳ chuyên nghiệp trên trình duyệt của bạn.
