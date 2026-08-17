## 1. Decorators là gì?
Nếu bạn đang học TypeScript để hướng tới làm chủ **NestJS** hoặc các framework OOP hiện đại (như Angular, TypeORM), **Decorators (Trình trang trí)** là kiến thức cốt lõi quan trọng nhất bạn bắt buộc phải hiểu rõ.

Decorators là một tính năng đặc biệt (hiện đang ở dạng đề xuất của TC39 và được TS hỗ trợ dưới dạng thử nghiệm) cho phép bạn **đính kèm metadata** hoặc **thay đổi hành vi** của Class, Phương thức (Method), Thuộc tính (Property), hoặc Tham số (Parameter) ngay khi chương trình được khởi tạo (runtime).

---

## 2. Kích hoạt Decorators trong dự án
Để sử dụng Decorators, bạn bắt buộc phải bật cấu hình sau trong file cấu hình `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## 3. Các loại Decorators phổ biến

### a. Class Decorator (Trang trí Class)
Class Decorator được khai báo ngay trước định nghĩa Class. Nó nhận vào đối số duy nhất là **hàm constructor** của Class đó và cho phép bạn thay đổi hoặc mở rộng hành vi của Class.

```typescript
function Logger(target: Function) {
  // target chính là constructor của class
  console.log(`Đang khởi tạo class: ${target.name}`);
}

@Logger
class UserService {
  constructor() {
    console.log("UserService created.");
  }
}
// Output khi chạy file: "Đang khởi tạo class: UserService"
```

---

### b. Method Decorator (Trang trí Phương thức)
Được đặt trước một phương thức của Class. Nó nhận vào 3 đối số:
1. `target`: Prototype của class (đối với phương thức instance) hoặc constructor của class (đối với phương thức static).
2. `propertyKey`: Tên của phương thức.
3. `descriptor`: Đối tượng PropertyDescriptor dùng để cấu hình hành vi của phương thức (như `value`, `writable`, `enumerable`, `configurable`).

#### Ví dụ: Tạo decorator `@LogMethod` tự động ghi log trước và sau khi gọi hàm
```typescript
function LogMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value; // Lưu trữ hàm gốc

  // Thay thế hàm gốc bằng một hàm mới
  descriptor.value = function (...args: any[]) {
    console.log(`[LOG] Bắt đầu gọi hàm ${propertyKey} với đối số:`, args);
    const result = originalMethod.apply(this, args); // Chạy hàm gốc
    console.log(`[LOG] Kết thúc hàm ${propertyKey}. Kết quả:`, result);
    return result;
  };
}

class Calculator {
  @LogMethod
  add(a: number, b: number): number {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(5, 10);
// Output console:
// [LOG] Bắt đầu gọi hàm add với đối số: [5, 10]
// [LOG] Kết thúc hàm add. Kết quả: 15
```

---

### c. Decorator Factories (Nhà máy sản xuất Decorators)
Nếu bạn muốn truyền thêm tham số cấu hình vào Decorator (ví dụ: `@Controller("/users")` trong NestJS), bạn cần viết một **Decorator Factory**. Đây là một hàm nhận vào tham số cấu hình của bạn và **trả về một Decorator thực tế**.

```typescript
// Decorator Factory
function Route(path: string) {
  return function (target: Function) {
    // Đính kèm đường dẫn path vào class metadata
    (target as any).prototype.routePath = path;
  };
}

@Route("/api/v1/users")
class UserController {
  routePath!: string;
}

const controller = new UserController();
console.log(controller.routePath); // Output: "/api/v1/users"
```

---

## 4. Ý niệm về Metadata và thư viện `reflect-metadata`

> [!IMPORTANT]
> ### Cách NestJS Dependency Injection hoạt động
> NestJS có thể tự động nhận biết kiểu dữ liệu của các Service được truyền vào Constructor nhờ cơ chế **emit metadata** của TypeScript kết hợp với thư viện **`reflect-metadata`**.
>
> Khi bật `emitDecoratorMetadata: true`, TypeScript sẽ tự động đính kèm thông tin về kiểu dữ liệu của các tham số lúc compile. NestJS dựa vào thông tin này tại runtime để tự động khởi tạo và tiêm (inject) các dependencies tương ứng (Dependency Injection) mà bạn không cần phải cấu hình thủ công.
