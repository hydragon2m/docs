// ==============================================================
// Bài tập Thực hành: Prometheus Custom Metrics Collection
// File: Observability & Security/09. Practice/02. Monitoring/01. Prometheus Metrics.ts
// ==============================================================

/**
 * ĐỀ BÀI:
 * 1. Sử dụng thư viện `prom-client` để thiết lập giám sát số liệu (Metrics):
 *    - Khởi tạo Prometheus Registry.
 *    - Bật thu thập Node.js default runtime metrics (`collectDefaultMetrics`).
 * 
 * 2. Thiết lập 2 Custom Metrics chính:
 *    - `http_requests_total` (Counter): Đếm số lượng HTTP request. Labels: `method`, `route`, `status`.
 *    - `http_request_duration_seconds` (Histogram): Đo latency của API. Labels: `method`, `route`.
 *      Buckets khuyên dùng: `[0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]`.
 * 
 * 3. Viết Middleware giả lập:
 *    - Bắt đầu đo thời gian khi nhận request.
 *    - Khi request hoàn tất (hoặc giả lập hoàn tất), tăng Counter và ghi nhận thời gian vào Histogram.
 * 
 * 4. Viết hàm `getMetricsHandler()`:
 *    - Trả về danh sách metrics chuẩn dạng Prometheus text format để Prometheus scraper thu thập.
 */

import * as client from 'prom-client';

// 1. Khởi tạo Registry
const register = new client.Registry();

// Tự động thu thập default metrics (RAM, CPU, GC...)
client.collectDefaultMetrics({ register });

// TODO 1: Khai báo Counter metric 'http_requests_total'
const httpRequestsCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Tổng số lượng HTTP Requests được xử lý',
  labelNames: ['method', 'route', 'status'],
});

// TODO 2: Khai báo Histogram metric 'http_request_duration_seconds'
const httpRequestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Thời gian xử lý HTTP Requests tính bằng giây',
  labelNames: ['method', 'route'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// Đăng ký custom metrics vào registry
register.registerMetric(httpRequestsCounter);
register.registerMetric(httpRequestDurationHistogram);

// TODO 3: Hoàn thiện Middleware đo đạc metrics giả lập
export async function mockMetricsMiddleware(
  req: { method: string; url: string },
  res: { statusCode: number },
  next: () => Promise<void>
) {
  const startTime = process.hrtime(); // Đo thời gian độ chính xác cao

  try {
    await next();
  } finally {
    // 1. Tính toán thời gian chênh lệch (duration) tính bằng giây
    const diff = process.hrtime(startTime);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    // 2. Tăng Counter http_requests_total với các nhãn tương ứng (req.method, req.url, res.statusCode)
    httpRequestsCounter.labels(req.method, req.url, res.statusCode.toString()).inc();

    // 3. Ghi nhận thời gian xử lý vào Histogram
    httpRequestDurationHistogram.labels(req.method, req.url).observe(durationInSeconds);
  }
}

// TODO 4: Viết handler trả về Prometheus Metrics Text Format
export async function getMetricsHandler(): Promise<string> {
  // Trả về dữ liệu text format từ register
  return register.metrics();
}

// ==============================================================
// KỊCH BẢN CHẠY THỬ (TEST SCENARIO)
// ==============================================================
async function runTest() {
  const req1 = { method: 'GET', url: '/api/v1/users' };
  const res1 = { statusCode: 200 };

  const req2 = { method: 'POST', url: '/api/v1/orders' };
  const res2 = { statusCode: 201 };

  // Giả lập xử lý request 1 tốn 150ms
  await mockMetricsMiddleware(req1, res1, async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  // Giả lập xử lý request 2 tốn 400ms
  await mockMetricsMiddleware(req2, res2, async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });

  // In ra metrics
  const prometheusData = await getMetricsHandler();
  console.log('--- PROMETHEUS METRICS SCRAPED OUTPUT ---');
  console.log(prometheusData.substring(0, 1000)); // In 1000 ký tự đầu để xem
}

runTest();
