## 1. Generic Classes là gì?
Tương tự như Interface và Type, **Class (Lớp)** trong TypeScript cũng hoàn toàn hỗ trợ Generic. Lớp Generic giúp bạn xây dựng các khuôn mẫu lớp (như cấu trúc dữ liệu, các lớp quản lý cơ sở dữ liệu - Repository, Cache...) có thể hoạt động hiệu quả với nhiều kiểu thực thể khác nhau mà vẫn đảm bảo tính an toàn kiểu dữ liệu cao nhất.

---

## 2. Cú pháp cơ bản
Chúng ta đặt tham số kiểu `<T>` ngay sau tên Class:

```typescript
class GenericNumber<NumType> {
  zeroValue!: NumType;
  add!: (x: NumType, y: NumType) => NumType;
}

const myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = (x, y) => x + y;
```

### Ví dụ ứng dụng thực tế: Xây dựng lớp MemoryCache (Bộ nhớ đệm)
```typescript
class MemoryCache<T> {
  private storage = new Map<string, T>();

  set(key: string, value: T): void {
    this.storage.set(key, value);
  }

  get(key: string): T | undefined {
    return this.storage.get(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

// Sử dụng cache cho thông tin User
interface User { id: number; name: string }
const userCache = new MemoryCache<User>();
userCache.set("user_1", { id: 1, name: "Alice" }); // ✅ Hợp lệ
// userCache.set("user_2", "invalid_data");       // ❌ Lỗi compile!
```

---

## 3. Cạm bẫy cực lớn: Thành viên tĩnh (Static Members) và Generic

> [!CAUTION]
> ### Ràng buộc kỹ thuật nghiêm ngặt
> Trong TypeScript, **các thành phần tĩnh (static properties và static methods) của một Class KHÔNG ĐƯỢC PHÉP tham chiếu đến tham số kiểu Generic của Class đó**.
>
> **Ví dụ lỗi:**
> ```typescript
> class Box<T> {
>   // ❌ Lỗi compile: Static members cannot reference class type parameters.
>   static defaultValue: T; 
>   
>   // ❌ Lỗi compile
>   static print(value: T) { console.log(value); } 
> }
> ```
>
> ### Tại sao lại bị cấm?
> Khi biên dịch sang JavaScript, Class thực chất là một đối tượng duy nhất (Constructor Function), và các thành phần `static` nằm trực tiếp trên đối tượng Constructor đó.
>
> Trong khi đó, tham số kiểu Generic `T` chỉ được xác định **khi bạn khởi tạo một instance cụ thể** bằng từ khóa `new` (ví dụ: `new Box<string>()` và `new Box<number>()`).
>
> Vì các thành phần tĩnh không thuộc về bất kỳ instance nào cụ thể và được truy cập trực tiếp qua tên Class (`Box.print()`), chúng không thể có cách nào biết được kiểu dữ liệu thực tế của `T` là gì.

---

## 4. Cách giải quyết khi cần hàm static Generic
Nếu bạn thực sự cần viết một phương thức `static` có tính chất Generic, hãy khai báo tham số kiểu **trực tiếp trên chính phương thức static đó** thay vì sử dụng tham số kiểu của Class:

```typescript
class Helper {
  // ✅ Hợp lệ! Khai báo Generic riêng cho method static này
  static printValue<V>(value: V): void {
    console.log(value);
  }
}

Helper.printValue<string>("hello"); // ✅ Chạy bình thường
```
