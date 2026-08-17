## I. KHÁI QUÁT (OVERVIEW)

### 1. Request Lifecycle là gì?
Trong NestJS, khi một Request từ Client đi tới Server, nó không đi thẳng vào Route Handler (Service) để xử lý dữ liệu ngay lập tức. Thay vào đó, nó phải vượt qua một **hệ thống các lớp phòng ngự và bổ trợ** được sắp xếp theo một thứ tự cực kỳ nghiêm ngặt. Hệ thống này được gọi là **Request Lifecycle (Vòng đời của một Request)**.

Hiểu rõ thứ tự thực thi của Request Lifecycle là chìa khóa để:
*   Định vị chính xác nơi viết các tác vụ bổ trợ (Xác thực, phân quyền, ghi log, nén dữ liệu, bắt lỗi).
*   Tránh các lỗi treo kết nối (hanging request) hoặc rò rỉ bộ nhớ.
*   Thiết kế hệ thống phòng ngự nhiều lớp (Defense-in-depth) chuẩn bảo mật.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Sơ đồ Tuần tự của Request Lifecycle
Dưới đây là sơ đồ toàn diện mô tả luồng đi của một request đi từ Client đến Controller và quay lại:

```mermaid
flowchart TD
    Client["Client Request"] --> MW["1. Middlewares<br/>(Global -> Module)"]
    
    subgraph GuardLayer["Authentication & Authorization"]
        MW --> Guard["2. Guards<br/>(Global -> Controller -> Route)"]
    end

    subgraph InterceptorPre["Pre-processing / Request Tap"]
        Guard --> Interceptor1["3. Interceptors (Pre-handler)<br/>(Global -> Controller -> Route)"]
    end

    subgraph PipeLayer["Validation & Transformation"]
        Interceptor1 --> Pipe["4. Pipes<br/>(Global -> Controller -> Route -> Parameter)"]
    end

    Pipe --> Handler["5. Route Handler<br/>(Controller / Service Logic)"]

    subgraph InterceptorPost["Post-processing / Response Map"]
        Handler --> Interceptor2["6. Interceptors (Post-handler)<br/>(RxJS: Route -> Controller -> Global)"]
    end

    Interceptor2 --> Outgoing["7. Outgoing Response"]
    
    subgraph ErrorHandling["Exception Processing"]
        Exception["Exception Thrown"] --> Filter["8. Exception Filters<br/>(Route -> Controller -> Global)"]
        Filter --> Outgoing
    end
    
    Handler -.->|Nếu xảy ra lỗi| Exception
    Guard -.->|Nếu trả về false (403 Forbidden)| Exception
    Pipe -.->|Nếu validation fail (400 Bad Request)| Exception
```

---

### 2. Chi tiết 5 Tầng xử lý trong NestJS

#### A. Middlewares (Tầng trung gian)
Middleware là tầng đầu tiên tiếp xúc với request. Nó có cấu trúc và chức năng giống hệt như Express Middleware.
*   **Đặc điểm:** Chạy trước bất kỳ Guard hay Interceptor nào. Có thể thay đổi đối tượng request (`req`) và response (`res`).
*   **Quy tắc:** Bắt buộc phải gọi hàm `next()` để chuyển tiếp request, nếu không request sẽ bị treo mãi mãi.
*   **Ứng dụng:** Cors, Cookie Parser, Compression, Body Parser, Request Logging (Pino/Morgan).

#### B. Guards (Tầng phòng ngự xác thực)
Guards chịu trách nhiệm duy nhất: Xác định xem request hiện tại có quyền thực thi route handler hay không (Authentication & Authorization).
*   **Đặc điểm:** Chạy sau Middleware nhưng trước Pipes và Interceptors. Có quyền truy cập vào `ExecutionContext` (cho phép biết rõ controller/method nào đang được gọi).
*   **Quy tắc:** Trả về một giá trị boolean (`true` để cho qua, `false` để chặn lại). Khi trả về `false`, NestJS sẽ tự động ném ra `ForbiddenException` (HTTP 403).
*   **Ứng dụng:** JWT Verification, Role-based Access Control (RBAC), Permission Checking.

#### C. Interceptors (Tầng can thiệp luồng dữ liệu)
Interceptors lấy cảm hứng từ kỹ thuật **AOP (Aspect-Oriented Programming)**. Nó cho phép bạn can thiệp vào cả hai chiều: trước khi route handler chạy và sau khi trả về kết quả.
*   **Đặc điểm:** Sử dụng thư viện **RxJS** mạnh mẽ để thao tác với luồng phản hồi (Response Stream).
*   **Ứng dụng:** Đo thời gian xử lý API, ghi đè định dạng Response (ví dụ: bọc data vào `{ success: true, data }`), tự động Cache dữ liệu, cơ chế tự động Timeout API.

#### D. Pipes (Tầng kiểm định & Biến đổi dữ liệu)
Pipes chạy ngay trước khi các tham số được nạp vào Route Handler.
*   **Đặc điểm:** Thực hiện hai nhiệm vụ chính:
    1.  **Transformation (Biến đổi):** Chuyển đổi dữ liệu đầu vào sang kiểu dữ liệu mong muốn (ví dụ: chuyển string `'10'` sang number `10`).
    2.  **Validation (Kiểm định):** Kiểm tra dữ liệu gửi lên (DTO) có hợp lệ không. Nếu không, ném trực tiếp lỗi `BadRequestException` (HTTP 400) mà không cần chạy vào controller.
*   **Ứng dụng:** Cú pháp validate dữ liệu gửi lên qua `class-validator`, parse ID sang UUID/ObjectId.

#### E. Exception Filters (Tầng bắt lỗi tập trung)
Exception Filter là tầng cuối cùng xử lý các lỗi phát sinh ngoài ý muốn hoặc các Exception được chủ động ném ra trong ứng dụng.
*   **Đặc điểm:** Giúp bạn kiểm soát định dạng của response trả về cho client khi xảy ra lỗi, tránh rò rỉ mã nguồn hoặc thông tin nhạy cảm của hệ thống.
*   **Ứng dụng:** Định dạng lại JSON lỗi, gửi cảnh báo (Slack, Email) khi xảy ra lỗi hệ thống (500 Internal Server Error).

---

### 3. ArgumentsHost vs Execution Context
Để viết được các Guards, Interceptors, và Exception Filters dùng chung ở mức nâng cao, bạn bắt buộc phải hiểu rõ hai Interface này:

#### A. ArgumentsHost
`ArgumentsHost` là một wrapper cung cấp quyền truy cập đến mảng các đối số được truyền vào handler. Nó giúp mã nguồn của bạn hoạt động đa giao thức (HTTP, WebSockets, và Microservices/RPC).

```typescript
// Trích xuất các đối tượng đặc thù theo giao thức
const ctx = host.switchToHttp();
const request = ctx.getRequest<Request>();
const response = ctx.getResponse<Response>();
```

#### B. ExecutionContext
`ExecutionContext` kế thừa từ `ArgumentsHost`, cung cấp thêm các thông tin chi tiết về lớp (Class) và phương thức (Method) hiện tại đang được thực thi.

```typescript
// Trích xuất Class và Method của Controller hiện tại
const currentClass = context.getClass(); // Ví dụ: UsersController
const currentHandler = context.getHandler(); // Ví dụ: createUser()
```

Kỹ thuật này cực kỳ hữu ích khi bạn kết hợp với `Reflector` để đọc các cấu hình MetaData (ví dụ: lấy danh sách các Role được phép truy cập API thông qua Decorator `@Roles('admin')`).

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Viết JWT Authentication Guard kết hợp Metadata
Dưới đây là một Guard kiểm tra quyền truy cập của người dùng dựa trên JWT Token và Metadata cấu hình trên Route:

```typescript
// ==============================================================
// File: src/auth/roles.guard.ts
// Guard phân quyền sử dụng Reflector để đọc Metadata
// ==============================================================
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Đọc danh sách roles được cấu hình bằng Decorator custom @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Nếu route không yêu cầu role, cho phép đi qua
    }

    // 2. Lấy thông tin user từ request (thường được gắn vào bởi AuthMiddleware hoặc Passport)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
    }

    // 3. Kiểm tra xem user có chứa role hợp lệ không
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Quyền hạn của bạn không đủ để thực hiện hành động này');
    }

    return true;
  }
}
```

### 2. Viết Response Transformation Interceptor đo đạc hiệu năng
Interceptor định dạng lại toàn bộ dữ liệu trả về của API và đo đạc thời gian thực thi (latency):

```typescript
// ==============================================================
// File: src/common/interceptors/transform.interceptor.ts
// Interceptor định dạng chuẩn đầu ra API & Đo lường Performance
// ==============================================================
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  duration: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const httpCtx = context.switchToHttp();
    const response = httpCtx.getResponse();
    const request = httpCtx.getRequest();
    
    const startTime = Date.now();

    // Dùng pipe() của RxJS để can thiệp luồng dữ liệu trả về
    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode,
        message: 'Request processed successfully',
        data: data || null,
        duration: `${Date.now() - startTime}ms`,
      })),
      tap(() => {
        const duration = Date.now() - startTime;
        console.log(`[API Log] ${request.method} ${request.url} - Success in ${duration}ms`);
      })
    );
  }
}
```

### 3. Viết Global Exception Filter để bắt và ghi log lỗi hệ thống
```typescript
// ==============================================================
// File: src/common/filters/http-exception.filter.ts
// Bắt lỗi toàn cục, ngăn chặn rò rỉ mã nguồn và ghi nhận log
// ==============================================================
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // Bắt toàn bộ các exception kế thừa từ Error
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Phân loại lỗi: Nếu là HttpException của NestJS thì lấy status, ngược lại là 500
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    const errorMessage = typeof message === 'string' ? message : (message as any).message || JSON.stringify(message);

    // Ghi log chi tiết lỗi ra console (hoặc Winston/Pino logger)
    console.error(`[Error Log] ${request.method} ${request.url} - Status: ${status} - Error: ${errorMessage}`);
    if (!(exception instanceof HttpException)) {
      console.error(exception); // In stack trace đối với các lỗi logic (Programmer Errors)
    }

    // Phản hồi định dạng JSON chuẩn cho client
    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      error: status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Đã xảy ra lỗi hệ thống nghiêm trọng' : errorMessage,
    });
  }
}
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & CORE RULES)

### 1. Cạm bẫy Dependency Injection với Global Components
Khi bạn bind một component ở mức Global bằng cách khai báo trực tiếp:

```typescript
app.useGlobalGuards(new RolesGuard()); // Dùng "new" thủ công
```

*   **Vấn đề:** Do bạn khởi tạo bằng từ khóa `new`, component này nằm ngoài IoC Container của NestJS. Vì thế, bạn **không thể inject** bất kỳ service nào vào constructor của `RolesGuard` (ví dụ: không thể inject `Reflector` hay `UserService`).
*   **Giải pháp:** Đăng ký Global Component thông qua mảng `providers` của một Module cốt lõi (ví dụ `AppModule`):

```typescript
// Trong app.module.ts
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Đăng ký Global Guard qua IoC Container để hỗ trợ DI
    },
  ],
})
export class AppModule {}
```

### 2. Sự khác biệt giữa `take`/`skip` và `limit`/`offset` trong Interceptor
(Xem thêm chi tiết ở phần TypeORM. Khi dùng Interceptor để transform, hãy luôn bảo toàn cấu trúc phân trang từ Repository).

---

## 💡 5 QUY TẮC VÀNG KHI THAO TÁC VỚI REQUEST LIFECYCLE
1.  **Đúng việc, đúng chỗ:** 
    *   Xác thực người dùng -> Dùng **Guards**.
    *   Biến đổi & Xác thực DTO dữ liệu -> Dùng **Pipes**.
    *   Thay đổi định dạng API đầu ra/đầu vào -> Dùng **Interceptors**.
    *   Cors/Nén dữ liệu/Ghi nhận log thô -> Dùng **Middlewares**.
2.  **Luôn giải phóng luồng trong Middleware:** Đảm bảo `next()` được gọi ở mọi nhánh logic của middleware, tránh treo request của người dùng.
3.  **Tận dụng tối đa RxJS trong Interceptor:** Tận dụng `timeout`, `catchError`, `retry`, `throttleTime` của RxJS để tăng độ ổn định của API mà không cần viết logic thủ công phức tạp.
4.  **Bọc nhạy cảm trong Exception Filters:** Luôn dùng AllExceptionFilter để che giấu các lỗi cơ sở dữ liệu quan hệ (chứa tên cột, cấu trúc bảng) trước khi trả về cho client.
5.  **Tránh ép buộc Request Scope vô ý:** Hãy nhớ rằng Guards, Interceptors, và Pipes mặc định là Singleton. Đừng chuyển chúng sang Request-scope trừ phi bắt buộc để bảo toàn hiệu năng.
