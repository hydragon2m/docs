## I. KHÁI QUÁT (OVERVIEW)

Giám sát (Monitoring) là một phần không thể thiếu trong vận hành hệ thống phần mềm hiện đại. Trong bài học này, chúng ta sẽ tìm hiểu về **Prometheus** - một nền tảng giám sát và cảnh báo mã nguồn mở cực kỳ phổ biến, đặc biệt trong môi trường Cloud Native và Microservices.

Prometheus hoạt động dựa trên mô hình **Pull-based** (kéo dữ liệu thay vì đợi các dịch vụ đẩy tới), sử dụng **Time Series Database (Cơ sở dữ liệu chuỗi thời gian)** để lưu trữ các metric với hiệu suất cao. Nó đi kèm với **PromQL (Prometheus Query Language)**, một ngôn ngữ truy vấn mạnh mẽ cho phép tổng hợp và phân tích dữ liệu theo thời gian thực.

Trong hệ sinh thái Node.js, chúng ta có thể dễ dàng cung cấp các metric cho Prometheus bằng cách sử dụng thư viện `prom-client`.

## II. CHI TIẾT KỸ THUẬT

### 1. Mô hình hoạt động của Prometheus
- **Pull-based Model**: Prometheus server định kỳ truy cập (scrape) vào một endpoint (thường là `/metrics`) trên ứng dụng của bạn để lấy dữ liệu. Điều này giúp ứng dụng không phải quan tâm đến việc kết nối hay trạng thái của monitoring server.
- **Time Series Database**: Mỗi metric được lưu trữ như một chuỗi các giá trị theo thời gian (chuỗi thời gian). Mỗi điểm dữ liệu bao gồm: tên metric, các nhãn (labels) định danh key-value, một dấu thời gian (timestamp) và một giá trị float64.
- **PromQL**: Ngôn ngữ cho phép lọc, nhóm, và thực hiện các phép toán trên các chuỗi thời gian để rút trích ra các thông tin có ý nghĩa.

### 2. Các loại Metric trong Prometheus
Prometheus định nghĩa 4 loại metric cốt lõi:

1. **Counter**: Bộ đếm, giá trị chỉ có thể **TĂNG LÊN** hoặc reset về 0 (ví dụ khi khởi động lại ứng dụng). Phù hợp để đếm:
   - Tổng số lượng HTTP request đã nhận.
   - Số lượng lỗi (exceptions) xảy ra.
   - Số lượng đơn hàng đã được tạo.

2. **Gauge**: Thước đo, giá trị có thể **TĂNG HOẶC GIẢM** tự do theo thời gian. Phù hợp để đo trạng thái hiện tại:
   - Số lượng active HTTP connections.
   - Bộ nhớ RAM đang sử dụng.
   - CPU usage.

3. **Histogram**: Phân phối tần suất dữ liệu vào các "nhóm" (buckets) được định nghĩa trước, đồng thời tính tổng tất cả các giá trị đo được. Thường dùng cho:
   - Đo độ trễ (latency) của API response time (vd: API này có bao nhiêu request hoàn thành dưới 100ms, dưới 200ms...).
   - Kích thước payload của request/response.

4. **Summary**: Tương tự Histogram, cũng tính tổng số quan sát và tổng giá trị, nhưng nó tự động tính toán các phân vị (quantiles/percentiles) trực tiếp trên phía client thay vì server. Ít phổ biến hơn Histogram vì không thể tổng hợp chéo giữa các instance phân tán.

> [!IMPORTANT]
> Trong môi trường phân tán (nhiều bản sao của cùng một service), **Histogram** được ưu tiên hơn **Summary** vì PromQL có thể tổng hợp (aggregate) các bucket của Histogram trên Prometheus server để tính percentile tổng, điều mà Summary không làm được do tính phân vị ở phía client không cộng gộp được.

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

Dưới đây là cách tích hợp thư viện `prom-client` vào ứng dụng Express.js để thu thập Default Metrics (CPU, Memory, Event Loop, GC) và Custom Metrics.

### 1. Cài đặt thư viện
```bash
npm install express prom-client
```

### 2. Triển khai thu thập Metrics

```javascript
// server.js
const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = 3000;

// Khởi tạo Registry để chứa các metrics
const register = new client.Registry();

// 1. Kích hoạt thu thập Node.js default metrics (Heap, CPU, GC, Event Loop)
// Các metrics này sẽ được tự động gắn thêm nhãn (label) 'app_name' để dễ phân biệt
client.collectDefaultMetrics({
  app: 'nodejs-express-app',
  prefix: 'node_', // Thêm tiền tố để chuẩn hóa
  timeout: 10000, // Chu kỳ update
  register: register
});

// 2. Định nghĩa Custom Metrics

// Counter: Tổng số lượng HTTP request
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Tổng số lượng HTTP requests đã nhận',
  labelNames: ['method', 'route', 'status_code'], // Các chiều phân tích
  registers: [register],
});

// Gauge: Số lượng concurrent / active connections hiện tại
const activeConnectionsGauge = new client.Gauge({
  name: 'active_connections_current',
  help: 'Số lượng kết nối HTTP đang active',
  registers: [register],
});

// Histogram: Thời gian phản hồi API (Latency)
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Thời gian xử lý HTTP request tính bằng giây',
  labelNames: ['method', 'route', 'status_code'],
  // Định nghĩa các buckets: 10ms, 50ms, 100ms, 200ms, 500ms, 1s, 2s, 5s
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

// 3. Middleware để tự động track các request vào hệ thống
app.use((req, res, next) => {
  // Tăng số connection active
  activeConnectionsGauge.inc();

  // Bắt đầu đếm thời gian thực thi (start timer)
  const endTimer = httpRequestDurationMicroseconds.startTimer();

  // Gắn hook khi response kết thúc
  res.on('finish', () => {
    // Giảm số connection active
    activeConnectionsGauge.dec();

    const route = req.route ? req.route.path : req.url; // Lấy route name, tránh lấy param động làm tăng số lượng series

    // Kết thúc timer và ghi nhận latency cho Histogram
    endTimer({ method: req.method, route: route, status_code: res.statusCode });

    // Tăng bộ đếm tổng số request
    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });
  });

  next();
});

// 4. API nghiệp vụ mẫu
app.get('/api/users', (req, res) => {
  // Giả lập một tiến trình xử lý mất khoảng 50-200ms
  setTimeout(() => {
    res.json({ message: 'Danh sách users' });
  }, Math.random() * 150 + 50);
});

app.get('/api/error', (req, res) => {
  res.status(500).json({ error: 'Internal Server Error' });
});

// 5. Endpoint /metrics cung cấp dữ liệu cho Prometheus Server
// Đảm bảo endpoint này an toàn (chỉ mở cổng nội bộ hoặc có IP whitelisting / basic auth)
app.get('/metrics', async (req, res) => {
  try {
    // Trả về định dạng chuẩn của Prometheus
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (ex) {
    res.status(500).end(ex.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Metrics endpoint: http://localhost:${PORT}/metrics`);
});
```

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

> [!WARNING]
> **Cardinality Explosion (Bùng nổ tổ hợp chiều dữ liệu)**
> Tuyệt đối KHÔNG gắn các nhãn (labels) chứa dữ liệu có biến thiên quá cao (high cardinality) vào metric.
> Ví dụ: Không đặt nhãn `user_id`, `email`, hay `path_with_dynamic_params` (như `/api/users/123`, `/api/users/456`) vào label. Mỗi tổ hợp label mới sẽ sinh ra một Time Series mới trong Prometheus. Hàng triệu user_id sẽ tạo ra hàng triệu series, làm sập Prometheus server ngay lập tức! Thay vào đó, hãy chuẩn hóa route thành `/api/users/:id`.

> [!CAUTION]
> **Bảo mật cho `/metrics` endpoint**
> Endpoint `/metrics` phơi bày nhiều thông tin nhạy cảm về hệ thống (phiên bản Node, cấu trúc route, trạng thái bộ nhớ). Tuyệt đối không expose `/metrics` ra ngoài internet công cộng. Bạn nên chạy endpoint này ở một PORT riêng dành cho quản trị nội bộ (internal network), hoặc bảo vệ bằng Basic Authentication / IP Whitelisting trong Load Balancer/Nginx.

> [!TIP]
> **Bucket chuẩn cho Histogram**
> Hãy thiết lập các bucket (các mức phân tích latency) phù hợp với SLA (Service Level Agreement) ứng dụng của bạn. Dải phân bổ mặc định đôi khi không đủ chi tiết nếu hệ thống của bạn yêu cầu độ trễ dưới 20ms, hoặc quá dư thừa. Chọn bucket sao cho tập trung vào vùng mà đa số API response time rơi vào.

> [!IMPORTANT]
> **Sự kiện bị rò rỉ bộ nhớ (Memory Leak) khi lưu Metric**
> Các metric như Counter, Histogram sau khi được khai báo sẽ sống cùng process Node.js mãi mãi. Nếu bạn vô tình sinh ra hàng tá metric động bằng code logic (VD: `new client.Counter({name: 'dynamic_name_' + id})`), Node.js process sẽ dần hết RAM (OOM) do không giải phóng được.
