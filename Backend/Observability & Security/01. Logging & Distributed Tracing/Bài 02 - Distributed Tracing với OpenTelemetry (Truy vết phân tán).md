## I. KHÁI QUÁT (OVERVIEW)

> [!NOTE] 
> Khi hệ thống chuyển sang Microservices, một request từ người dùng có thể đi qua hàng chục service khác nhau. Khi có lỗi chậm chạp, làm sao biết nút thắt (bottleneck) nằm ở đâu? Đó là lúc cần Distributed Tracing.

Distributed Tracing (Truy vết phân tán) giúp lập bản đồ toàn bộ vòng đời của một request khi nó đi qua nhiều dịch vụ.

Các khái niệm cốt lõi:
- **Trace**: Toàn bộ hành trình của một request (từ lúc bắt đầu ở Gateway đến lúc trả về cho User).
- **Span**: Một đơn vị công việc bên trong Trace (VD: query DB mất 5ms, gọi API nội bộ mất 20ms). Một Trace chứa nhiều Span (cây thư mục).
- **Span Context**: Chứa Trace ID và Span ID.
- **Context Propagation**: Kỹ thuật đóng gói Span Context và truyền nó giữa các service qua HTTP Headers. Chuẩn phổ biến nhất hiện nay là **W3C Trace Context** (sử dụng header `traceparent`).

**OpenTelemetry (OTel)**: Là tiêu chuẩn công nghiệp mới, hợp nhất từ OpenTracing và OpenCensus. Nó cung cấp SDK độc lập với vendor, bạn có thể viết code một lần và gửi dữ liệu trace về Jaeger, Zipkin, Datadog hay New Relic mà không cần sửa code.

## II. CHI TIẾT KỸ THUẬT

### 1. Kiến trúc của OpenTelemetry
- **Instrumentation**: Mã nguồn được cài cắm để tự động sinh ra Span khi có HTTP request, DB query.
- **SDK**: Công cụ thu thập các span này và đẩy (export) đi.
- **OTLP (OpenTelemetry Protocol)**: Giao thức chuẩn để gửi data.
- **Collector**: Thành phần đứng giữa nhận OTLP từ các service, xử lý (lọc, batching) rồi xuất sang các backend lưu trữ như Jaeger.

### 2. Auto-instrumentation trong Node.js
Trong hệ sinh thái Node, OTel cung cấp các module auto-instrumentation cho `express`, `http`, `pg`, `ioredis`, `nestjs`. Nó monkey-patch các thư viện này ở tầng dưới cùng, do đó bạn không cần sửa code nghiệp vụ mà vẫn có Span tự động.

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

### 1. Cấu hình Tracer (File tracer.ts)
Bạn bắt buộc phải require/import file này đầu tiên, **trước cả khi import express hay bất kỳ thư viện nào khác** để OTel có thể monkey-patch chúng.

```typescript
// tracer.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// 1. Cấu hình exporter để đẩy dữ liệu tới Jaeger/OTel Collector
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // Endpoint OTLP HTTP
});

// 2. Khởi tạo SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'order-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter,
  // Tự động hook vào các thư viện phổ biến (Express, HTTP, pg,...)
  instrumentations: [getNodeAutoInstrumentations()]
});

// Bắt đầu tracing
sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

### 2. Tích hợp vào ứng dụng
Khi chạy ứng dụng, file `tracer.ts` phải được thực thi đầu tiên:
```bash
node -r ./dist/tracer.js ./dist/main.js
```

### 3. Tạo Custom Span bằng tay
Dù Auto-instrumentation đã bao phủ hầu hết (DB, HTTP, Redis), đôi khi bạn muốn trace một hàm tính toán phức tạp.

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-custom-tracer');

async function processHeavyTask() {
  // Tạo một child span bên trong active span hiện tại (nếu có)
  return await tracer.startActiveSpan('processHeavyTask', async (span) => {
    try {
      span.setAttribute('task.id', 1234);
      
      // ... logic tốn thời gian ...
      await new Promise(res => setTimeout(res, 500));
      
      span.addEvent('Task completed successfully');
      
    } catch (err) {
      // Ghi nhận lỗi vào span
      span.recordException(err);
      span.setStatus({ code: 2, message: err.message }); // 2 = ERROR
      throw err;
    } finally {
      span.end(); // BẮT BUỘC phải gọi end() để đóng span
    }
  });
}
```

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

> [!WARNING] 
> Thập tự chinh thư viện (Library versions).
> Auto-instrumentation chỉ hỗ trợ các phiên bản cụ thể của thư viện (ví dụ `express` v4, `pg` v8). Nếu bạn dùng bản mới quá hoặc cũ quá, tracing sẽ không hoạt động. Hãy luôn kiểm tra ma trận tương thích trên tài liệu của OTel.

> [!CAUTION] 
> Quên gọi `span.end()`.
> Khi tạo custom span, nếu xảy ra lỗi làm văng ra ngoài khối catch và bạn không gọi `span.end()` trong `finally`, span đó sẽ bị rò rỉ bộ nhớ và làm nhiễu dữ liệu.

> [!TIP] 
> Kết hợp Trace ID vào Log.
> Để có sức mạnh tuyệt đối, hãy cấu hình Pino để chèn `trace_id` từ OpenTelemetry vào mỗi dòng JSON log. Khi đó, từ một span lỗi trên Jaeger, bạn có thể query chính xác các dòng log sinh ra trong span đó trên ElasticSearch. (Gợi ý: Dùng `@opentelemetry/instrumentation-pino`).

> [!IMPORTANT] 
> Không gửi 100% trace trên môi trường có high traffic.
> Cấu hình **Sampling**. Thay vì thu thập tất cả, hãy thiết lập `ParentBasedSampler` kết hợp với `TraceIdRatioBased` (ví dụ thu thập 5% lượng request, nhưng luôn thu thập nếu parent đã được sampled hoặc request bị lỗi).
