## I. KHÁI QUÁT (OVERVIEW)

### 1. Biến môi trường (Environment Variables) là gì?
**Biến môi trường (Environment Variables)** là các cặp khóa - giá trị (Key-Value pairs) được lưu trữ và quản lý ở cấp độ Hệ điều hành (OS). Chúng cung cấp các tham số cấu hình động cho các tiến trình (processes) đang chạy mà không cần phải can thiệp hay thay đổi mã nguồn (Source Code).

Trong môi trường Node.js, khi một tiến trình được khởi chạy, toàn bộ biến môi trường từ Hệ điều hành được nạp tự động vào đối tượng toàn cục:
```javascript
// Truy cập biến môi trường trong Node.js
const port = process.env.PORT;
const dbHost = process.env.DB_HOST;
```

```mermaid
flowchart TD
    OS["HỆ ĐIỀU HÀNH (OS ENVIRONMENT)<br/>PORT=5000 • NODE_ENV=production • DB_HOST=10.0.0.1"]
    PROC["TIẾN TRÌNH NODE.JS (PROCESS)<br/>process.env = {<br/>  PORT: \"5000\",<br/>  NODE_ENV: \"production\",<br/>  DB_HOST: \"10.0.0.1\"<br/>}"]
    OS -->|"Khởi tạo tiến trình (node app.js)"| PROC
```

---

### 2. Phương pháp luận 12-Factor App (Factor III: Config)
Phương pháp luận tiêu chuẩn xây dựng ứng dụng đám mây (Cloud-native applications) **The Twelve-Factor App** đặt ra nguyên tắc cốt lõi:

> *"Một ứng dụng phải phân tách hoàn toàn giữa Mã nguồn (Code) và Cấu hình (Config). Cấu hình thay đổi giữa các môi trường triển khai (Development, Staging, Production), nhưng mã nguồn thì hoàn toàn giữ nguyên."*

```mermaid
flowchart TD
    CODE["MÃ NGUỒN DUY NHẤT (SOURCE CODE)<br/>const dbUrl = config.database.url;"]
    DEV["MÔI TRƯỜNG DEV<br/>DB_HOST=local"]
    STAG["MÔI TRƯỜNG STAG<br/>DB_HOST=stag"]
    PROD["MÔI TRƯỜNG PROD<br/>DB_HOST=aws"]

    CODE -->|"(Deploy Dev)"| DEV
    CODE -->|"(Deploy Staging)"| STAG
    CODE -->|"(Deploy Prod)"| PROD
```

**Tại sao không được hardcode cấu hình trong code?**
1. **Rò rỉ bảo mật (Security Breach):** Đưa mật khẩu DB, API keys, JWT Secrets lên GitHub/GitLab là nguyên nhân hàng đầu khiến hệ thống bị xâm nhập.
2. **Kém linh hoạt (Inflexibility):** Thay đổi địa chỉ kết nối Database đòi hỏi phải sửa code, commit, re-build và re-deploy toàn bộ dự án.
3. **Vi phạm chuẩn Continuous Delivery:** Một bản build duy nhất (Docker Image / Artifact) phải có khả năng chạy ở bất kỳ môi trường nào chỉ bằng việc thay đổi cấu hình truyền vào.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Thư viện `dotenv` và Cú pháp File `.env`

Trong quá trình phát triển cục bộ (Local Development), việc gõ lệnh xuất biến môi trường bằng tay trên Terminal (`export PORT=3000`) rất tốn thời gian. Thư viện **`dotenv`** giải quyết vấn đề này bằng cách tự động đọc file `.env` và đưa các giá trị vào `process.env`.

```mermaid
flowchart LR
    ENV["File .env<br/>PORT=4000"] --> DOT["Thư viện dotenv<br/>config()"] --> PROC["process.env<br/>{ PORT: \"4000\" }"]
```

#### a. Cách nạp dotenv vào ứng dụng:
* **Cách 1 (Trong code - đặt ở dòng đầu tiên của entry point):**
  ```javascript
  require('dotenv').config();
  ```
* **Cách 2 (Qua CLI flag - Khuyên dùng, không làm bẩn source code):**
  ```bash
  node -r dotenv/config dist/server.js
  ```

#### b. Quy tắc cú pháp chuẩn của file `.env`:
* **Cặp Key-Value:** `KEY=VALUE` (Không có khoảng trắng quanh dấu `=`).
* **Comments:** Dòng bắt đầu bằng dấu thăng `#` sẽ được bỏ qua.
* **Giá trị có khoảng trắng hoặc ký tự đặc biệt:** Bọc trong dấu nháy kép `""` hoặc nháy đơn `''`.
* **Giá trị nhiều dòng (Multiline - ví dụ: RSA Private Key):** Bọc trong dấu ngoặc kép và sử dụng ký tự xuống dòng `\n`.
* **Nội suy biến (Variable Expansion):** Sử dụng gói `dotenv-expand` để tham chiếu giá trị của biến khác.

```env
# -------------------------------------------------------------
# CẤU HÌNH SERVER VÀ MÔI TRƯỜNG
# -------------------------------------------------------------
NODE_ENV=development
PORT=5000
HOST=127.0.0.1

# Chuỗi có khoảng trắng
APP_NAME="Hệ Thống Quản Lý Đơn Hàng"

# Cấu hình Database & Nội suy biến (với dotenv-expand)
DB_USER=admin
DB_PASS=SuperSecret123!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shop_db
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Khóa bí mật nhiều dòng (Multiline RSA Key)
RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0Y5...\n-----END RSA PRIVATE KEY-----"
```

---

### 2. Phân tách cấu hình theo môi trường (Multi-Environment Setup)

Một hệ thống doanh nghiệp thực tế trải qua nhiều môi trường:
* `.env.development`: Môi trường lập trình của cá nhân/team (chứa URL mock, local DB).
* `.env.test`: Môi trường chạy Unit Test & Integration Test (CSDL In-memory / Test DB tạm).
* `.env.staging`: Môi trường kiểm thử tiền phát hành (Pre-production - tương đương 99% Prod).
* `.env.production`: Môi trường thực tế phục vụ người dùng cuối (Không bao giờ lưu file này vào Git).
* `.env.local`: Cấu hình ghi đè cá nhân cho từng lập trình viên (Luôn nằm trong `.gitignore`).

```mermaid
flowchart TD
    D["NODE_ENV=development"] -->|"Nạp"| DF[".env.development (Ghi đè bởi .env.local nếu có)"]
    T["NODE_ENV=test"] -->|"Nạp"| TF[".env.test"]
    P["NODE_ENV=production"] -->|"Nạp"| PF["Biến môi trường từ Cloud / Kubernetes Secret"]
```

#### Mã nguồn nạp file `.env` theo `NODE_ENV` linh hoạt:
```javascript
const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';

// 1. Nạp file cấu hình đặc thù của môi trường (.env.development / .env.production)
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${env}`),
});

// 2. Nạp file .env mặc định (fallback)
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});
```

---

### 3. Thiết kế Config Module tập trung (Single Source of Truth)

> [!CAUTION]
> **Anti-pattern: Gọi `process.env.XYZ` rải rác khắp mã nguồn**
> Nếu bạn gọi `process.env.DATABASE_URL` trong Repository, gọi `process.env.JWT_SECRET` trong Middleware, và gọi `process.env.STRIPE_KEY` trong Service:
> - **Không có Type Safety:** `process.env` luôn trả về `string | undefined`.
> - **Khó bảo trì:** Đổi tên biến môi trường buộc phải tìm và thay thế (Find & Replace) trên toàn bộ dự án.
> - **Khó kiểm thử:** Cực kỳ khó khăn khi viết Unit Test cần mock cấu hình.

#### Kiến trúc Config Module chuẩn:
Tất cả các biến môi trường chỉ được đọc **DUY NHẤT MỘT LẦN** tại một file trung tâm (`src/config/index.js` hoặc `src/config/index.ts`), được validate, ép kiểu, gắn giá trị mặc định, và đóng băng (`Object.freeze()`).

```mermaid
flowchart TD
    ENV["process.env"] --> CFG["SRC/CONFIG/INDEX.JS (SINGLE SOURCE OF TRUTH)<br/>• Nạp biến môi trường<br/>• Ép kiểu: String ➔ Number, Boolean, Array<br/>• Gán Default Fallback Values<br/>• Validate Schema (Fail Fast nếu sai)<br/>• Object.freeze() (Bảo vệ tính bất biến)"]
    CFG -->|"(Import config object)"| AUTH["Auth Service"]
    CFG -->|"(Import config object)"| DB["DB Service"]
```

---

### 4. Cơ chế Validation cấu hình khi Khởi động (Fail-Fast Strategy)

**Nguyên lý Fail-Fast:** Nếu ứng dụng thiếu một biến môi trường bắt buộc (như `JWT_SECRET`) hoặc cấu hình sai kiểu dữ liệu (như `PORT="abc"`), ứng dụng **PHẢI DỪNG LẬP TỨC (CRASH NGAY LÚC KHỞI ĐỘNG)** với thông báo lỗi chi tiết, thay vì cố chạy rồi phát sinh lỗi khi người dùng gọi API.

Sử dụng thư viện Schema Validation như **`joi`** hoặc **`zod`** để kiểm soát:

```javascript
// src/config/schema.js
const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required().messages({
    'any.required': 'DATABASE_URL là bắt buộc để kết nối cơ sở dữ liệu!',
    'string.uri': 'DATABASE_URL phải là một URI hợp lệ (e.g. postgres://...)',
  }),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET phải có độ dài tối thiểu 32 ký tự để đảm bảo an toàn!',
    'any.required': 'JWT_SECRET là bắt buộc để ký Access Token!',
  }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  CORS_ORIGIN: Joi.string().default('*'),
}).unknown(); // Cho phép các biến môi trường phụ khác của OS

module.exports = envSchema;
```

---

### 5. Bảo mật Secrets trong Doanh nghiệp & Cloud

```mermaid
flowchart TD
    ROOT["SECRET MANAGEMENT HIERARCHY"]
    ROOT --> LOCAL["LOCAL DEVELOPMENT<br/>• File .env (Nằm trong .gitignore)<br/>• File .env.example (Public mẫu)<br/>• Không bao giờ commit secret thật"]
    ROOT --> PROD["ENTERPRISE / PRODUCTION<br/>• AWS Secrets Manager / SSM Param<br/>• HashiCorp Vault<br/>• GCP Secret Manager / Azure Vault<br/>• Kubernetes Secrets / Doppler"]
```

#### Quy tắc quản trị Secrets:
1. **Luôn có file `.env.example`:** Mọi repository phải có `.env.example` liệt kê đầy đủ tên các biến môi trường cần thiết kèm giá trị mẫu giả lập để thành viên mới trong team chỉ cần chạy `cp .env.example .env` là bắt đầu code được ngay.
2. **Cấu hình `.gitignore` chuẩn:**
   ```gitignore
   .env
   .env.*
   !.env.example
   ```
3. **Secret Injection trong Kubernetes/Docker:**
   * Không bao giờ dùng lệnh `COPY .env .env` trong `Dockerfile` (Bake secret vào image khiến ai kéo image về cũng thấy secret).
   * Thay vào đó, inject secret tại Runtime thông qua Kubernetes Secret / ConfigMap hoặc AWS ECS Task Definition.

---

### 6. Quản lý Cấu hình trong NestJS Framework

NestJS cung cấp gói giải pháp `@nestjs/config` chuẩn hóa toàn bộ việc quản lý cấu hình:

```mermaid
flowchart TD
    APP["AppModule"] --> CFG["ConfigModule.forRoot({ isGlobal: true, validationSchema })"]
    CFG --> SVC["Any Service"]
    SVC --> CTOR["Constructor(private configService: ConfigService)"]
    CTOR --> GET["this.configService.get&lt;number&gt;('PORT')"]
```

#### Cấu hình chi tiết trong NestJS:
```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService có thể inject ở mọi Module mà không cần import lại
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Dưới đây là kiến trúc thiết kế Config Module toàn diện chuẩn Enterprise, có khả năng Fail-Fast, ép kiểu tự động và hỗ trợ Immutability.

### 1. File: `.env.example` (Template công khai cho Team)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:password@localhost:5432/my_app_db
JWT_SECRET=super_secret_key_minimum_32_characters_long_123456
JWT_EXPIRES_IN=1h
REDIS_HOST=localhost
REDIS_PORT=6379
ENABLE_EMAIL_NOTIFICATION=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### 2. File: `src/config/index.js` (Centralized Config Module)
```javascript
const path = require('path');
const dotenv = require('dotenv');
const Joi = require('joi');

// 1. Xác định môi trường hiện tại
const environment = process.env.NODE_ENV || 'development';

// 2. Nạp file .env tương ứng
const envFilePath = path.resolve(process.cwd(), `.env.${environment}`);
dotenv.config({ path: envFilePath });
// Nạp fallback .env mặc định
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 3. Định nghĩa Schema Validation với Joi
const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test', 'staging').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'Thiếu biến môi trường bắt buộc: DATABASE_URL',
  }),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'Thiếu biến môi trường bắt buộc: JWT_SECRET',
    'string.min': 'JWT_SECRET phải có tối thiểu 32 ký tự!',
  }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().default(6379),
  ENABLE_EMAIL_NOTIFICATION: Joi.boolean().default(false),
  ALLOWED_ORIGINS: Joi.string().default('*'),
}).unknown(); // Bỏ qua các biến hệ thống khác

// 4. Thực thi Validate
const { value: envVars, error } = configSchema.validate(process.env, {
  abortEarly: false, // Liệt kê TẤT CẢ các biến bị lỗi thay vì dừng ở lỗi đầu tiên
  stripUnknown: false,
});

// 5. Nếu có lỗi cấu hình -> Dừng tiến trình ngay lập tức (FAIL FAST)
if (error) {
  console.error('\n❌ [FATAL] LỖI CẤU HÌNH BIẾN MÔI TRƯỜNG KHI KHỞI ĐỘNG:');
  error.details.forEach((detail) => {
    console.error(`  👉 ${detail.message}`);
  });
  console.error('\nVui lòng kiểm tra lại file .env hoặc cấu hình máy chủ trước khi chạy lại ứng dụng.\n');
  process.exit(1); // Thoát chương trình với mã lỗi
}

// 6. Xây dựng Object cấu hình có cấu trúc phân cấp (Structured & Type-casted)
const config = {
  env: envVars.NODE_ENV,
  isProduction: envVars.NODE_ENV === 'production',
  isDevelopment: envVars.NODE_ENV === 'development',
  isTest: envVars.NODE_ENV === 'test',

  server: {
    port: Number(envVars.PORT),
    allowedOrigins: envVars.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
  },

  db: {
    url: envVars.DATABASE_URL,
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
  },

  redis: {
    host: envVars.REDIS_HOST,
    port: Number(envVars.REDIS_PORT),
  },

  features: {
    enableEmailNotification: Boolean(envVars.ENABLE_EMAIL_NOTIFICATION),
  },
};

// 7. Đóng băng Object để tránh việc vô tình bị ghi đè thuộc tính ở nơi khác
Object.freeze(config);
Object.freeze(config.server);
Object.freeze(config.db);
Object.freeze(config.jwt);
Object.freeze(config.redis);
Object.freeze(config.features);

module.exports = config;
```

### 3. File: `src/services/auth.service.js` (Cách sử dụng Config sạch)
```javascript
const jwt = require('jsonwebtoken');
const config = require('../config'); // Import từ Single Source of Truth duy nhất

class AuthService {
  generateToken(payload) {
    // Truy cập an toàn, có gợi ý code (IntelliSense) và đã được validate
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  getDatabaseConnection() {
    console.log(`Đang kết nối Database tại: ${config.db.url}`);
  }
}

module.exports = new AuthService();
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy Type Casting: `process.env` LUÔN LUÔN trả về kiểu chuỗi (String)!
> Trong Node.js, mọi giá trị trong `process.env` đều có kiểu dữ liệu là `string` hoặc `undefined`.
> ```javascript
> // File .env:
> // ENABLE_FEATURE=false
> // PORT=8080
>
> console.log(typeof process.env.ENABLE_FEATURE); // "string"
> console.log(typeof process.env.PORT);           // "string"
>
> // ❌ CẠM BẪY NGUY HIỂM 1: Chuỗi "false" là TRUTHY trong JavaScript!
> if (process.env.ENABLE_FEATURE) {
>   // Khối này LUÔN LUÔN CHẠY vì chuỗi non-empty "false" có giá trị true trong điều kiện if!
> }
>
> // ❌ CẠM BẪY NGUY HIỂM 2: Phép cộng chuỗi
> const nextPort = process.env.PORT + 1; // Kết quả: "80801" thay vì 8081!
>
> // ✅ GIẢI PHÁP: Luôn ép kiểu tường minh trong Config Module
> const isFeatureEnabled = process.env.ENABLE_FEATURE === 'true';
> const portNumber = Number(process.env.PORT);
> ```

> [!WARNING]
> ### 2. Cạm bẫy `dotenv` không tự override biến môi trường đã tồn tại trong Hệ điều hành
> Theo thiết kế mặc định của `dotenv`, nếu một biến môi trường **đã tồn tại sẵn trên Hệ điều hành** (hoặc được set qua lệnh `export PORT=9000`), thư viện `dotenv` sẽ **KHÔNG ghi đè** giá trị trong file `.env` lên biến đó.
> 
> ```javascript
> // Giả sử Terminal đã chạy: export PORT=9000
> // File .env có dòng: PORT=3000
> require('dotenv').config();
> 
> console.log(process.env.PORT); // In ra: "9000" (Không phải 3000!)
> 
> // Nếu muốn file .env bắt buộc ghi đè biến OS, phải truyền option:
> require('dotenv').config({ override: true });
> ```

> [!CAUTION]
> ### 3. Nguy cơ Rò rỉ Secrets qua Docker Build Stage và Logging
> 1. **Dùng lệnh ARG trong Dockerfile:** Nếu bạn truyền `ARG DB_PASS=secret` trong Dockerfile, bất kỳ ai có quyền truy cập vào Docker Image cũng có thể xem được mật khẩu này thông qua lệnh `docker history <image-id>`.
> 2. **Log toàn bộ `process.env`:** Tuyệt đối không bao giờ viết `console.log(process.env)` trong mã nguồn. Toàn bộ API keys, Private keys sẽ bị gửi lên dịch vụ lưu trữ log (như CloudWatch, Datadog, Papertrail) và ai có quyền đọc log cũng sẽ thấy toàn bộ secrets.

> [!IMPORTANT]
> ### 4. Triết lý Fail-Fast: Kiểm tra cấu hình trước khi khởi động bất kỳ dịch vụ nào
> Thứ tự khởi động ứng dụng chuẩn:
> 1. **Bước 1:** Nạp biến môi trường và Validate Schema.
> 2. **Bước 2 (Nếu Fail):** In danh sách lỗi và `process.exit(1)`.
> 3. **Bước 3 (Nếu Pass):** Kết nối Database, Redis, RabbitMQ.
> 4. **Bước 4:** Lắng nghe HTTP Port (`app.listen()`).
> 
> Tuyệt đối không kết nối Database trước khi validate cấu hình!

> [!TIP]
> ### 5. Sử dụng `Object.freeze()` để bảo vệ tính toàn vẹn của cấu hình
> Trong JavaScript, các object có thể bị thay đổi giá trị thuộc tính (mutate) ở bất kỳ file nào nếu ai đó vô tình viết: `config.db.url = 'something_else'`. Hãy luôn gọi `Object.freeze()` trên tất cả các cấp của đối tượng config để đảm bảo cấu hình là hằng số bất biến trong toàn bộ vòng đời ứng dụng.
