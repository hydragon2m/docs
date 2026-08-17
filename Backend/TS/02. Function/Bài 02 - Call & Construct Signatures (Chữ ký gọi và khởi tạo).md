## 1. Call Signatures (Chữ ký gọi của đối tượng)
Trong JavaScript, bản thân hàm (Function) thực chất là một đối tượng đặc biệt (callable object). Nghĩa là ngoài khả năng thực thi, **hàm còn có thể sở hữu các thuộc tính và phương thức riêng** của nó.

Cú pháp **Function Type Expression** (`(a: number) => void`) ở Bài 1 không thể mô tả được trường hợp một hàm có chứa thêm các thuộc tính đính kèm. Để làm được điều này, TypeScript cung cấp cú pháp **Call Signatures** viết bên trong Interface hoặc Type Alias đối tượng.

### Cú pháp:
Lưu ý: Chúng ta dùng dấu hai chấm `:` thay vì dấu mũi tên `=>` để chỉ định kiểu trả về bên trong dấu ngoặc nhọn `{}`:

```typescript
interface DescribableFunction {
  description: string;          // Thuộc tính thông thường
  (someArg: number): boolean;   // Call Signature (khả năng gọi như hàm)
}
```

### Ví dụ thực tế:
```typescript
function doSomething(fn: DescribableFunction) {
  console.log(`${fn.description} trả về: ${fn(6)}`);
}

// Tạo một hàm có gắn thêm thuộc tính
const checkEven = (num: number) => num % 2 === 0;
checkEven.description = "Hàm kiểm tra số chẵn";

doSomething(checkEven); // ✅ Hoàn toàn hợp lệ!
```

---

## 2. Construct Signatures (Chữ ký khởi tạo)
Trong JavaScript, các hàm còn có thể được gọi bằng từ khóa `new` để tạo ra một đối tượng mới (đóng vai trò là Constructor Function hoặc Class).

TypeScript hỗ trợ định nghĩa kiểu cho các hàm khởi tạo này bằng cách thêm từ khóa `new` trước phần chữ ký gọi:

### Cú pháp:
```typescript
interface SomeConstructor {
  new (s: string): SomeObject; // Construct Signature
}
```

### Ví dụ thực tế:
```typescript
class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

// Định nghĩa hàm factory nhận vào một constructor và trả về một instance mới
function createInstance(ctor: SomeConstructor, name: string) {
  return new ctor(name);
}

const myDog = createInstance(Animal, "Lucky");
console.log(myDog.name); // "Lucky"
```

---

## 3. Khác biệt cú pháp: Function Type Expression vs Call Signature

Cần phân biệt kỹ hai cú pháp này để tránh lỗi viết sai:

```typescript
// 1. Function Type Expression (Sử dụng =>)
type SimpleFunc = (arg: string) => void;

// 2. Call Signature bên trong Object Type (Sử dụng :)
type DetailedFunc = {
  (arg: string): void;
};
```
Cả hai kiểu trên đều mô tả một hàm nhận vào `string` và trả về `void`, nhưng cách 2 cho phép bạn viết thêm các thuộc tính khác của hàm vào bên dưới.
