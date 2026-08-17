## I. KHÁI QUÁT (OVERVIEW)

Bảo mật là một trong những khía cạnh quan trọng nhất khi phát triển các hệ thống Backend, đặc biệt là với Node.js và NestJS. OWASP (Open Web Application Security Project) Top 10 là danh sách 10 rủi ro bảo mật ứng dụng web phổ biến và nguy hiểm nhất. Việc hiểu và phòng ngừa các rủi ro này, kết hợp với các kỹ thuật API Hardening (làm cứng API), sẽ giúp hệ thống của bạn chống lại các cuộc tấn công phổ biến như SQL Injection, XSS, CSRF, DDoS hay rò rỉ dữ liệu nhạy cảm.

Trong bài học này, chúng ta sẽ đi sâu vào việc triển khai thực tế các kỹ thuật bảo mật cốt lõi trong môi trường Node.js và NestJS, biến các khái niệm lý thuyết thành các dòng code vững chắc.

## II. CHI TIẾT KỸ THUẬT

### 1. SQL Injection Mitigation (Ngăn chặn SQLi)
SQL Injection xảy ra khi dữ liệu đầu vào của người dùng không được kiểm tra và được chèn trực tiếp vào câu truy vấn SQL, cho phép kẻ tấn công thực thi các lệnh SQL trái phép.
- **Biện pháp**: Luôn sử dụng Parameterized queries (truy vấn có tham số) hoặc ORM/Query Builder an toàn như TypeORM, Prisma. Các công cụ này mặc định đã escape dữ liệu đầu vào.

### 2. XSS và CSRF Protection
- **XSS (Cross-Site Scripting)**: Kẻ tấn công chèn các mã script độc hại vào trang web. Trong API, cần đảm bảo escape dữ liệu đầu ra và sử dụng `Content-Security-Policy` để hạn chế nguồn thực thi script.
- **CSRF (Cross-Site Request Forgery)**: Kẻ tấn công lừa trình duyệt của người dùng gửi các request trái phép đến một API mà họ đã xác thực.
  - **Biện pháp**: Sử dụng cơ chế Double Submit Cookie, cấu hình thuộc tính `SameSite` cho cookies (chẳng hạn `SameSite=Strict` hoặc `Lax`), hoặc yêu cầu Anti-CSRF tokens.

### 3. HTTP Security Headers với Helmet
Helmet là một middleware cho Express/Fastify giúp thiết lập các HTTP headers bảo mật để phòng chống các lỗ hổng đã biết.
- **HSTS (HTTP Strict Transport Security)**: Ép buộc trình duyệt chỉ giao tiếp qua HTTPS.
- **Content Security Policy (CSP)**: Ngăn chặn XSS và các cuộc tấn công chèn dữ liệu khác.
- **X-Frame-Options**: Chống Clickjacking bằng cách không cho phép nhúng site vào thẻ iframe.
- **X-Content-Type-Options**: Ngăn chặn MIME-sniffing.

### 4. CORS (Cross-Origin Resource Sharing) Policies
CORS là cơ chế an toàn do trình duyệt áp đặt, xác định ai được quyền gọi tới API của bạn.
- Cấu hình `Access-Control-Allow-Origin: *` là một thảm họa bảo mật đối với các API yêu cầu xác thực.
- Cần chỉ định đích danh (whitelist) các domains hợp lệ được phép truy cập.

### 5. Rate Limiting và Ngăn chặn Brute-force/DDoS
- **Rate Limiting**: Giới hạn số lượng request từ một IP trong một khoảng thời gian nhất định (sử dụng `@nestjs/throttler`).
- Hỗ trợ chống lại brute-force attack (như dò password) và giảm thiểu tác động của DDoS ở tầng ứng dụng (Application Layer DDoS). Khuyến cáo nên có thêm rate limiting ở tầng API Gateway / WAF.

### 6. Data Masking (Che giấu dữ liệu nhạy cảm)
Không bao giờ log hoặc trả về các thông tin nhạy cảm như passwords, tokens, PII (Personally Identifiable Information) dạng clear text.
- Xóa bỏ hoặc che giấu (`***`) dữ liệu trước khi ném vào các thư viện logging.
- Dùng `class-transformer` (`@Exclude()`) trong NestJS để tránh rò rỉ qua response.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

### 1. Phòng chống SQL Injection với TypeORM & Prisma
Không bao giờ dùng string interpolation hoặc nối chuỗi để tạo SQL raw query.

```typescript
// ❌ BAD: Dễ bị SQL Injection
const username = req.body.username; // input: "admin' OR 1=1 --"
const query = `SELECT * FROM users WHERE username = '${username}'`;
await repository.query(query);

// ✅ GOOD (TypeORM): Sử dụng Parameterized Queries cho Raw SQL
await repository.query(`SELECT * FROM users WHERE username = $1`, [username]);

// ✅ GOOD (TypeORM QueryBuilder): Tự động escape
await repository.createQueryBuilder("user")
  .where("user.username = :username", { username })
  .getOne();

// ✅ GOOD (Prisma): Prisma mặc định đã sử dụng parameterized query
const user = await prisma.user.findUnique({
  where: { username }
});
```

### 2. Thiết lập Helmet, CORS và CSRF trong NestJS

Tại `main.ts`, ta thiết lập các lớp phòng thủ ban đầu cho ứng dụng.

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Kích hoạt Helmet để set các Security Headers
  // Helmet tự động cấu hình HSTS, X-Frame-Options, CSP (cơ bản), X-Content-Type-Options
  app.use(helmet());
  
  // Custom CSP nếu cần thiết cho REST API
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"], // Backend API thường không cần load tài nguyên
      scriptSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  }));

  // 2. Cấu hình CORS an toàn
  app.enableCors({
    origin: ['https://trustedsite.com', 'https://admin.trustedsite.com'], // KHÔNG DÙNG '*'
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Cho phép đính kèm cookie (quan trọng nếu dùng SameSite cookies)
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // 3. Sử dụng Cookie Parser và thiết lập CSRF Protection (Double Submit Cookie pattern)
  app.use(cookieParser());
  
  // Khởi tạo csurf middleware, yêu cầu cookie
  // Note: Kể từ Express 4, csurf đã bị deprecated, 
  // có thể thay thế bằng thư viện modern như 'csrf-csrf' hoặc dựa vào SameSite cookie + CORS.
  // Ví dụ thiết lập SameSite cookie cho Auth Token:
  // res.cookie('accessToken', token, { httpOnly: true, secure: true, sameSite: 'strict' });

  await app.listen(3000);
}
bootstrap();
```

> [!TIP]
> Đối với API thuần túy (không render HTML) và sử dụng JWT gửi qua Authorization header (Bearer token), bạn không cần quan tâm đến CSRF. CSRF chỉ xảy ra khi trình duyệt tự động gửi đính kèm Auth Cookie trong request. Nếu dùng Cookie, hãy set `SameSite=Strict` kết hợp với CORS chặn origin lạ.

### 3. Rate Limiting chống Brute-force & DDoS (NestJS Throttler)

Cài đặt module `@nestjs/throttler`. Cấu hình trong `app.module.ts`:

```typescript
import { Module } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Cấu hình Rate limit: Tối đa 10 requests trong 60 giây cho mỗi IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply global
    },
  ],
})
export class AppModule {}
```

> [!NOTE] 
> Throttler mặc định lưu trữ state trong memory (RAM), nếu bạn chạy ứng dụng Node.js trên nhiều instances (Cluster/Kubernetes), bạn cần dùng Redis store cho Throttler (`@nestjs/throttler-storage-redis`) để đồng bộ dữ liệu rate limit giữa các node.

### 4. Data Masking (Che giấu dữ liệu khi Logging)

Sử dụng `class-transformer` để tránh trả về password.

```typescript
import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: number;
  username: string;

  @Exclude() // Không bao giờ xuất hiện trong JSON response
  passwordHash: string;
}
```

Đối với Logging (ví dụ dùng Winston hoặc Pino), viết một hàm serializer để che giấu các trường nhạy cảm trong request body:

```typescript
// Hàm tiện ích mask data
export function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const maskedObj = { ...obj };
  const sensitiveKeys = ['password', 'token', 'refreshToken', 'creditCard'];

  for (const key of Object.keys(maskedObj)) {
    if (sensitiveKeys.includes(key)) {
      maskedObj[key] = '***MASKED***';
    } else if (typeof maskedObj[key] === 'object') {
      maskedObj[key] = maskSensitiveData(maskedObj[key]); // Đệ quy
    }
  }
  return maskedObj;
}

// Khi log request tại middleware
const safeBody = maskSensitiveData(req.body);
logger.info('Incoming request', { body: safeBody, path: req.path });
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

> [!WARNING]
> **Không tin tưởng bất kỳ input nào từ người dùng**. Kể cả khi có Validation (DTO), dữ liệu vẫn có thể độc hại. Luôn dùng Parameterized Query để giao tiếp với DB và Encode/Escape dữ liệu khi trả về nếu có tương tác DOM (mặc dù với REST/GraphQL API trả JSON thì frontend thường chịu trách nhiệm escape XSS).

> [!CAUTION]
> **Hiểm họa `CORS: *` với `Credentials: true`**. Không bao giờ cấu hình `origin: '*'` nếu API của bạn cho phép gửi cookie xác thực (`credentials: true`). Trình duyệt sẽ chặn cấu hình này, nhưng nếu bạn linh động map Origin của client thành allowed origin một cách mù quáng, bạn sẽ mở cửa cho tấn công. Luôn kiểm tra origin nằm trong whitelist.

> [!IMPORTANT]
> **Tầng bảo vệ (Defense in Depth)**. Rate Limiting ở tầng Node.js (như Throttler) chỉ bảo vệ khỏi Brute-force ở mức ứng dụng. Để chống lại DDoS quy mô lớn (Volumetric Attacks), bạn BẮT BUỘC phải cấu hình Rate Limiting và DDoS Protection ở các tầng cao hơn như API Gateway (Kong, Nginx), WAF, hoặc Cloudflare, AWS Shield. Node.js single-thread rất dễ sập nếu phải tự hứng hàng vạn request rác.

> [!TIP]
> **Keep Dependencies Updated**. Một phần quan trọng trong bảo mật Node.js là các gói NPM (Dependencies). Các lỗ hổng Prototype Pollution hoặc ReDoS thường xuất phát từ thư viện bên thứ 3. Hãy tích hợp lệnh `npm audit` vào CI/CD pipeline để liên tục quét và chặn các bản build sử dụng thư viện dính CVE (Common Vulnerabilities and Exposures).
