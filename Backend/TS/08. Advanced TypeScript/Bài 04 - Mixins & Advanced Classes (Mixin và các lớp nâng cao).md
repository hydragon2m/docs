## 1. Giới hạn của Kế thừa Đơn (Single Inheritance)
Trong JavaScript và TypeScript, các lớp (Classes) tuân theo mô hình **Kế thừa đơn**. Nghĩa là một Class chỉ được phép kế thừa (`extends`) từ **duy nhất một Class cha**.

Điều này gây khó khăn khi bạn muốn một Class sở hữu đồng thời các tính năng từ nhiều nguồn khác nhau (ví dụ: một lớp `SmartPhone` vừa muốn kế thừa tính năng của `Camera`, vừa muốn kế thừa tính năng của `Phone` và `MusicPlayer`).

Để giải quyết vấn đề này, chúng ta sử dụng thiết kế **Mixins (Lớp trộn)**.

---

## 2. Thiết kế Mixins trong TypeScript
Bản chất của Mixin là: **Sử dụng một hàm nhận vào một Class Constructor (hàm tạo) làm đầu vào, và trả về một Class mới kế thừa Class đó nhưng được bổ sung thêm các tính năng mới**.

### Cú pháp triển khai:

#### Bước 1: Định nghĩa kiểu dữ liệu đại diện cho một Constructor bất kỳ
```typescript
type Constructor = new (...args: any[]) => {};
```

#### Bước 2: Viết hàm Mixin bổ sung tính năng
```typescript
// Mixin thêm tính năng lưu trữ log
function Loggable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    log(msg: string) {
      console.log(`[LOG] ${new Date().toISOString()}: ${msg}`);
    }
  };
}

// Mixin thêm tính năng kích hoạt/tắt hoạt động
function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;
    activate() { this.isActive = true; }
    deactivate() { this.isActive = false; }
  };
}
```

#### Bước 3: Tổ hợp Mixin để tạo ra Class hoàn chỉnh
```typescript
class SimpleUser {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

// Trộn các tính năng Loggable và Activatable vào SimpleUser
const AdvancedUser = Loggable(Activatable(SimpleUser));

// Khởi tạo đối tượng từ class đã được trộn tính năng
const userInstance = new AdvancedUser("Alice");
userInstance.activate(); // ✅ Có tính năng Activatable
userInstance.log(`User ${userInstance.name} đang hoạt động: ${userInstance.isActive}`); 
// ✅ Có tính năng Loggable. Output: [LOG] 2026-08-17...: User Alice đang hoạt động: true
```

---

## 3. Kiến thức lớp nâng cao: Parameter Properties (Thuộc tính Tham số)

Đây là một tính năng cực kỳ quan trọng được sử dụng liên tục trong **NestJS Dependency Injection**.

Thay vì phải khai báo thuộc tính trước rồi gán giá trị thủ công trong constructor:
```typescript
class User {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
```

TypeScript cho phép bạn gộp tất cả các bước trên thành một dòng duy nhất bằng cách thêm từ khóa truy cập (`public`, `private`, `protected`, hoặc `readonly`) ngay trước tham số của constructor:

```typescript
class User {
  // TypeScript tự động tạo thuộc tính name, tự gán giá trị truyền vào cho name
  constructor(public name: string, private readonly id: number) {}
}

const u = new User("Alice", 101);
console.log(u.name); // "Alice"
// console.log(u.id); // ❌ Lỗi compile: Property 'id' is private.
```
*Ứng dụng trong NestJS:* Khi bạn viết `constructor(private readonly userService: UserService) {}`, NestJS sẽ tự động hiểu đây là khai báo thuộc tính và tự động tiêm class `UserService` tương ứng vào khi khởi tạo service.
