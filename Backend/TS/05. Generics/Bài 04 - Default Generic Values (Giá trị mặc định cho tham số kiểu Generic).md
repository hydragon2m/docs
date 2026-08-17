## 1. Khái niệm cơ bản
Ở **Bài 01**, bạn đã biết rằng khi sử dụng một Generic Type hoặc Interface, chúng ta bắt buộc phải truyền vào tham số kiểu một cách tường minh, nếu không TypeScript sẽ báo lỗi.

Tuy nhiên, có nhiều trường hợp một kiểu dữ liệu thường xuyên hoạt động với một kiểu mặc định nhất định (ví dụ: một API Response thường trả về đối tượng JSON rỗng `{}` hoặc kiểu `any`, một Component giao diện mặc định nhận kiểu phần tử là `HTMLElement`).

Để tối giản hóa code và tránh việc bắt buộc phải gõ lại tham số kiểu, TypeScript cung cấp tính năng **Default Generic Values (Giá trị mặc định cho tham số kiểu)**.

---

## 2. Cú pháp cơ bản
Chúng ta gán giá trị mặc định cho tham số kiểu bằng dấu bằng `=` tương tự như cách gán tham số mặc định cho hàm thông thường:

```typescript
interface Container<T = string> {
  value: T;
}

// ✅ Hợp lệ! Vì có giá trị mặc định là string, 
// TypeScript tự động hiểu myContainer tương đương với Container<string>
const myContainer: Container = { value: "hello" }; 

// Bạn vẫn có thể truyền kiểu khác bình thường để ghi đè giá trị mặc định:
const numberContainer: Container<number> = { value: 100 };
```

---

## 3. Các quy tắc kỹ thuật bắt buộc phải tuân thủ

> [!IMPORTANT]
> ### Thứ tự sắp xếp các tham số kiểu (Parameter Order)
> Tương tự như tham số của hàm, các tham số kiểu có giá trị mặc định **phải được khai báo sau** các tham số kiểu không có giá trị mặc định.
>
> **Ví dụ SAI:**
> ```typescript
> // ❌ Lỗi compile: Required type parameters cannot follow optional type parameters.
> interface Dictionary<K = string, V> {
>   key: K;
>   value: V;
> }
> ```
>
> **Ví dụ ĐÚNG:**
> ```typescript
> // ✅ Hợp lệ
> interface Dictionary<V, K = string> {
>   key: K;
>   value: V;
> }
> ```

---

## 4. Ứng dụng thực tế: Cấu hình Client kết nối cơ sở dữ liệu (Database Client)

Hãy thiết kế một lớp kết nối database cho phép thiết lập cấu hình tùy biến, nhưng mặc định sử dụng cấu hình tiêu chuẩn:

```typescript
interface DBConfig {
  host: string;
  port: number;
}

// Khai báo lớp DatabaseClient với giá trị cấu hình mặc định là DBConfig
class DatabaseClient<ConfigType = DBConfig> {
  config: ConfigType;

  constructor(config: ConfigType) {
    this.config = config;
  }
}

// 1. Sử dụng cấu hình mặc định (Không cần viết <DBConfig> rườm rà)
const defaultClient = new DatabaseClient({ host: "localhost", port: 5432 });

// 2. Sử dụng cấu hình tùy biến nâng cao (Ghi đè bằng kiểu mới)
interface CustomConfig {
  url: string;
  ssl: boolean;
}
const customClient = new DatabaseClient<CustomConfig>({
  url: "postgres://user:pass@host/db",
  ssl: true
});
```
