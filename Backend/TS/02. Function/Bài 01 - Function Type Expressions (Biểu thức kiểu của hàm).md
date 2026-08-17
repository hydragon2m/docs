## 1. Function Type Expressions là gì?
Trong JavaScript, hàm là các đối tượng hạng nhất (first-class citizens), nghĩa là chúng ta có thể truyền hàm làm tham số vào một hàm khác, lưu hàm vào biến, hoặc trả về một hàm từ hàm khác (Callback/Higher-Order Functions).

Trong TypeScript, **Function Type Expressions** (Biểu thức kiểu của hàm) cung cấp cú pháp đơn giản nhất để bạn mô tả chính xác **chữ ký kiểu** của một hàm: nhận vào tham số gì và trả về giá trị gì.

---

## 2. Cú pháp cơ bản

Cú pháp của Function Type Expressions rất giống với hàm mũi tên (Arrow Function) trong ES6:

```typescript
(tham_số_1: kiểu_1, tham_số_2: kiểu_2) => kiểu_trả_về
```

### Ví dụ 1: Gán kiểu cho một biến chứa hàm
```typescript
// Định nghĩa kiểu cho biến greeter: nhận vào chuỗi string và không trả về gì (void)
let greeter: (message: string) => void;

greeter = (msg) => {
  console.log(msg);
};
```

### Ví dụ 2: Dùng làm tham số Callback cho hàm khác
```typescript
function printCombined(a: number, b: number, callback: (result: number) => void): void {
  const sum = a + b;
  callback(sum); // Thực thi hàm callback được truyền vào
}

printCombined(10, 20, (res) => console.log(`Kết quả là: ${res}`));
```

---

## 3. Kết hợp với Type Alias để tăng khả năng tái sử dụng

Nếu biểu thức kiểu của hàm quá dài hoặc được sử dụng ở nhiều nơi, bạn nên đặt cho nó một **Type Alias** để code sạch và dễ quản lý:

```typescript
// Định nghĩa bí danh kiểu cho hàm tính toán toán học
type GreetFunction = (name: string, title?: string) => string;

const welcomeUser: GreetFunction = (name, title) => {
  return `Chào mừng ${title ? title + " " : ""}${name}`;
};
```

---

## 4. Các Lưu ý quan trọng và lỗi thường gặp

> [!CAUTION]
> ### 1. Tên của tham số trong Function Type Expression là BẮT BUỘC
> Trong JavaScript/TypeScript, khi định nghĩa biểu thức kiểu hàm, bạn **bắt buộc phải đặt tên cho tham số** (ví dụ: `(x: number) => void`), không được chỉ viết mỗi kiểu dữ liệu (ví dụ: `(number) => void`).
>
> ```typescript
> // ❌ SAI (TypeScript sẽ hiểu tham số tên là 'number' và có kiểu là 'any')
> type Formatter = (number) => string;
> 
> // ✅ ĐÚNG
> type Formatter = (value: number) => string;
> ```

> [!IMPORTANT]
> ### 2. Mối quan hệ tương thích kiểu (Function Type Compatibility)
> TypeScript cho phép bạn gán một hàm có **ít tham số hơn** vào một biến kiểu hàm yêu cầu nhiều tham số hơn, miễn là kiểu của các tham số tương ứng khớp nhau. Đây không phải lỗi, mà là hành vi thiết kế có chủ ý để tương thích với JavaScript thực tế (ví dụ: callback của `Array.prototype.forEach` nhận tối đa 3 tham số, nhưng chúng ta thường chỉ truyền hàm nhận 1 tham số).
>
> ```typescript
> type BinaryOperation = (a: number, b: number) => number;
> 
> // ✅ Hợp lệ! Hàm chỉ dùng 1 tham số 'a' nhưng vẫn gán được cho kiểu yêu cầu 2 tham số.
> const square: BinaryOperation = (a) => a * a; 
> ```
