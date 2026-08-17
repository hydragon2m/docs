## I. KHÁI QUÁT (OVERVIEW)

> [!NOTE] 
> Logging là cửa sổ duy nhất để bạn nhìn vào "tâm hồn" (trạng thái) của ứng dụng khi nó đang chạy trên production.

Structured Logging (ghi log có cấu trúc) là phương pháp xuất các dòng log dưới định dạng mà máy tính có thể dễ dàng đọc và phân tích (thường là JSON), thay vì những dòng text thuần túy.

Tại sao không dùng `console.log`?
- **Khó phân tích**: Khi hệ thống lớn, bạn dùng ElasticSearch, Datadog hay Splunk để gom log. Parser rất khó bóc tách `console.log("User 123 failed to login")`.
- **Hiệu năng**: `console.log` trong Node.js (cụ thể là `process.stdout`) có thể gây block event loop trong một số trường hợp.
- **Thiếu Context**: Không biết log này thuộc request nào, server nào, thời gian chính xác (millisecond) ra sao.

**Pino** là một thư viện logging cực nhanh cho Node.js, lấy cảm hứng từ Bunyan nhưng được tối ưu hóa tối đa về hiệu suất.
- Triết lý: Zero-overhead, sinh lượng rác thấp nhất (low allocation).
- Format mặc định là JSON.
- Hỗ trợ các công cụ vận chuyển (transports) để ghi ra file, gửi qua mạng, nhưng xử lý ở luồng riêng (worker thread).

## II. CHI TIẾT KỸ THUẬT

### 1. So sánh Winston và Pino
Winston từng là tiêu chuẩn vàng, nhưng Pino vượt trội hơn về tốc độ (nhanh hơn từ 5x lần) do cách Pino xử lý chuỗi và tối ưu hóa cấp thấp. Winston tạo nhiều object trung gian dẫn đến việc Garbage Collector (GC) phải làm việc nhiều hơn.

### 2. Thiết lập Correlation ID / Request ID
Trong hệ thống nhiều service, làm sao để biết dòng log này thuộc về user request nào? Ta gán cho mỗi request một ID duy nhất (Request ID). Khi gọi qua service khác, ID này biến thành Correlation ID để xâu chuỗi toàn bộ hành trình.

### 3. AsyncLocalStorage (ALS)
Làm thế nào để truyền Request ID từ Middleware xuống tận Database query mà không cần thêm tham số `requestId` vào mọi hàm? 
Node.js cung cấp `AsyncLocalStorage` (thuộc module `async_hooks`). Nó cho phép lưu trữ state xuyên suốt vòng đời của một luồng xử lý bất đồng bộ (giống như Thread Local Storage trong Java/C#).

### 4. Custom Serializer
Bạn tuyệt đối không được log `password`, `token`, hoặc thông tin thẻ tín dụng (PII, PCI compliance). Pino cho phép thiết lập *serializers* để tự động che dấu (redact) các thông tin nhạy cảm.

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

### 1. Khởi tạo Pino và che giấu dữ liệu nhạy cảm
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }; // Đổi level thành string in hoa thay vì số
    },
  },
  redact: {
    paths: ['req.headers.authorization', 'body.password', 'body.creditCard'],
    censor: '***REDACTED***'
  }
});

export default logger;
```

### 2. Tích hợp AsyncLocalStorage để theo dõi Request ID
```typescript
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import express from 'express';
import logger from './logger';

const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

const app = express();

// Middleware 1: Tạo context và Request ID
app.use((req, res, next) => {
  const store = new Map<string, string>();
  // Lấy từ header nếu request đến từ service khác, nếu không thì tự sinh
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  store.set('requestId', requestId);
  
  // Mọi code chạy bên trong run() đều truy cập được store này
  asyncLocalStorage.run(store, () => {
    next();
  });
});

// Hàm tiện ích để log kèm context
function logInfo(message: string, obj: any = {}) {
  const store = asyncLocalStorage.getStore();
  const requestId = store?.get('requestId');
  logger.info({ ...obj, requestId }, message);
}

// Controller
app.get('/api/users', async (req, res) => {
  logInfo('Incoming request to fetch users', { method: req.method, path: req.path });
  
  await fetchUsersFromDb();
  
  res.json({ status: 'ok' });
});

// Repository (Nằm ở file khác, không cần truyền requestId)
async function fetchUsersFromDb() {
  // Vẫn lấy được requestId nhờ AsyncLocalStorage
  logInfo('Executing DB Query: SELECT * FROM users');
  // ... db query
}

app.listen(3000, () => console.log('Server running on 3000'));
```

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

> [!CAUTION] 
> Rò rỉ thông tin nhạy cảm.
> Đừng bao giờ `logger.info(userObject)`. Luôn chỉ định rõ ràng các trường cần log hoặc sử dụng `redact` của pino.

> [!WARNING] 
> Thắt cổ chai hiệu năng với `AsyncLocalStorage`.
> Tuy ALS rất tiện, nhưng nó có một overhead nhỏ về hiệu suất (khoảng 3-5%). Trong các ứng dụng đòi hỏi độ trễ cực thấp (high-frequency trading), bạn cần cân nhắc. Tuy nhiên với 99% web app thông thường, chi phí này là hoàn toàn chấp nhận được để đánh đổi lấy sự tiện lợi.

> [!TIP] 
> Đừng format JSON ở môi trường local.
> Khi dev trên máy, nhìn JSON rất rối mắt. Hãy cài `pino-pretty` và dùng lệnh: `node app.js | pino-pretty`. Pino sẽ tự phát hiện pipe này và hiển thị log dạng text đẹp mắt.

> [!IMPORTANT] 
> Không cấu hình Transport trực tiếp trong main thread của production.
> Nếu muốn gửi log sang Datadog, hãy dùng pino transport chạy ở worker thread hoặc tốt nhất là ghi ra `stdout`, sau đó dùng một tác nhân bên ngoài (như Fluent Bit hoặc Promtail) để đẩy log đi.
