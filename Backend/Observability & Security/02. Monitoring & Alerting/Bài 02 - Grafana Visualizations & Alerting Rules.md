## I. KHÁI QUÁT (OVERVIEW)

Nếu **Prometheus** đóng vai trò là "Bộ脑" thu thập, lưu trữ dữ liệu thời gian thực và đánh giá các biểu thức, thì **Grafana** chính là "Khuôn mặt", nơi trực quan hóa (visualize) những dữ liệu khô khan đó thành các biểu đồ đẹp mắt, dashboard theo dõi trạng thái hệ thống, và cấu hình các cảnh báo (alerts) rõ ràng.

Trong việc xây dựng Dashboard giám sát cho ứng dụng Node.js, hai phương pháp luận thiết kế chuẩn mực thường được áp dụng là:
1. **RED Method** (Dành cho Services / API): 
   - **R**ate: Số lượng request mỗi giây (Throughput).
   - **E**rrors: Số lượng hoặc phần trăm request bị lỗi.
   - **D**uration: Thời gian thực thi (Latency / Response time).
2. **USE Method** (Dành cho Tài nguyên hệ thống / Infrastructure):
   - **U**tilization: Tỉ lệ sử dụng tài nguyên (vd: CPU 85%).
   - **S**aturation: Mức độ quá tải / hàng đợi (vd: Thread pool queue).
   - **E**rrors: Lỗi phần cứng, lỗi cạn kiệt tài nguyên.

## II. CHI TIẾT KỸ THUẬT

### 1. Kết nối Prometheus Data Source vào Grafana
Grafana không tự lưu trữ dữ liệu, nó đọc dữ liệu từ các Data Source. Để cấu hình:
1. Mở Grafana Dashboard (thường ở cổng 3000).
2. Tới `Configuration` -> `Data Sources` -> `Add data source`.
3. Chọn **Prometheus**.
4. Cấu hình HTTP URL: trỏ đến địa chỉ của Prometheus Server (ví dụ: `http://prometheus:9090`).
5. Click **Save & Test** để xác nhận kết nối thành công.

### 2. Viết PromQL cho Dashboard (RED Method)

**A. Rate (Throughput) - Tổng số Request mỗi giây**
Sử dụng hàm `rate()` để tính toán tốc độ tăng trung bình mỗi giây của biến Counter.
```promql
# Tính tổng request trên mỗi route trong 5 phút vừa qua
sum(rate(http_requests_total[5m])) by (route)
```

**B. Errors - Tỷ lệ lỗi (Error Rate)**
Tính tỉ lệ số request bị lỗi HTTP 5xx so với tổng số request.
```promql
# Tỷ lệ phần trăm lỗi HTTP 5xx
sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m])) * 100
```

**C. Duration - Độ trễ của API (Latency P95/P99)**
Sử dụng `histogram_quantile()` để tính bách phân vị thứ 95 (P95) và 99 (P99).
```promql
# Tính P95 Latency của toàn bộ hệ thống
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

### 3. Thiết lập Alerting Rules
Cảnh báo đóng vai trò thông báo cho On-call Engineer khi hệ thống có dấu hiệu bất thường trước khi nó sập hoàn toàn. Alerting có thể được định cấu hình trên Grafana Alerting hoặc Prometheus Alertmanager.

Các kênh gửi cảnh báo phổ biến: Slack, Telegram, Email, PagerDuty, Webhook (gọi API nội bộ).

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

Dưới đây là file cấu hình Alert Rule mẫu của Prometheus (YAML format) để xử lý các yêu cầu cảnh báo kinh điển.

```yaml
# prometheus-alert-rules.yml
groups:
  - name: NodejsApplicationAlerts
    rules:
      
      # 1. Cảnh báo Error Rate vượt quá 5% trong vòng 2 phút
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status_code=~"5.."}[1m])) 
            / 
            sum(rate(http_requests_total[1m]))
          ) * 100 > 5
        for: 2m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "Tỷ lệ lỗi cao (Vượt mức 5%) trên {{ $labels.instance }}"
          description: "Tỷ lệ lỗi HTTP 5xx của ứng dụng hiện tại là {{ $value | humanize }}%, vượt ngưỡng 5% trong 2 phút qua. Có thể có lỗi logic hoặc mất kết nối DB."

      # 2. Cảnh báo CPU Usage cao (Vượt 85% trong 5 phút)
      # Giả sử dùng node_cpu_seconds_total
      - alert: HighCpuUsage
        expr: |
          100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100) > 85
        for: 5m
        labels:
          severity: warning
          team: devops
        annotations:
          summary: "CPU Usage quá tải trên {{ $labels.instance }}"
          description: "Mức sử dụng CPU đang ở mức {{ $value | humanize }}% trong hơn 5 phút. Hãy xem xét scale-out ứng dụng."
          
      # 3. Cảnh báo Memory (Heap) Usage cao (>85% kéo dài 5 phút)
      - alert: HighMemoryUsage
        expr: |
          (node_memory_HeapUsed_bytes / node_memory_HeapTotal_bytes) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Node.js Heap Memory quá cao trên {{ $labels.instance }}"
          description: "Ứng dụng đang sử dụng {{ $value }}% Heap Memory. Nguy cơ xảy ra Out Of Memory (OOM) nếu có Memory Leak."

      # 4. Service Down (Cảnh báo Health check fail)
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
          team: ops
        annotations:
          summary: "Service đã bị Down: {{ $labels.instance }}"
          description: "Prometheus không thể thu thập metrics (scrape) từ instance {{ $labels.instance }} trong 1 phút qua. Ứng dụng có thể đã sập hoàn toàn."
```

Sau khi Alertmanager hoặc Grafana nhận được tín hiệu cảnh báo này, bạn có thể thiết lập **Contact Points** trong Grafana (Notification channels) bằng cách dán Webhook URL của Slack/Telegram vào và cấu hình tự động gửi JSON payload chứa nội dung `annotations.description` đến các kênh chat của nhóm kỹ sư.

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

> [!WARNING]
> **Flapping Alerts (Báo động giả liên tục)**
> Tuyệt đối không đặt thời gian điều kiện (`for`) quá ngắn, như `for: 0m` hoặc `10s`. Hệ thống luôn có các gai (spikes) tài nguyên ngắn ngủi (VD: lúc rác được thu gom - Garbage Collection, hoặc lúc scale). Đặt thời gian không phù hợp sẽ tạo ra hàng trăm cảnh báo rác, làm kỹ sư bị "Lờn cảnh báo" (Alert Fatigue) và phớt lờ cảnh báo thực sự quan trọng. Thường dùng `for: 5m` cho Resource và `for: 2m` cho Error Rate là cân bằng.

> [!CAUTION]
> **Aggregation nhầm cấp độ**
> Khi viết PromQL, hãy nhớ sử dụng `by (instance, route)` nếu bạn chạy hệ thống với nhiều Pod/Container phân tán. Nếu dùng `sum()` mà quên chia theo `instance`, bạn sẽ không thể biết cảnh báo đó sinh ra từ máy chủ số 1 hay máy chủ số 5, gây lúng túng trong việc điều tra sự cố.

> [!TIP]
> **Chia Mức Độ Nghiêm Trọng (Severity Levels)**
> Luôn sử dụng nhãn `severity` để phân luồng cảnh báo:
> - `severity: critical`: Gọi điện thoại, nhắn tin khẩn cấp giữa đêm (Page) vì ứng dụng chết hoặc Error rate quá cao ảnh hưởng khách hàng diện rộng.
> - `severity: warning`: Chỉ gửi tin nhắn Slack/Email để team đọc vào sáng hôm sau (ví dụ: Disk/RAM đạt 85%, hệ thống vẫn chạy nhưng cần dọn dẹp dần).

> [!IMPORTANT]
> **Kiểm thử cảnh báo**
> Sau khi thiết lập Rule, hãy luôn cố tình gây tải hoặc làm chết một instance nội bộ (chaos engineering) để xem alert bắn về Slack/Telegram có thành công, rõ ràng, chứa link direct về Dashboard phân tích log không. Một hệ thống alert không bao giờ kích hoạt khi có lỗi là một hệ thống alert vô dụng!
