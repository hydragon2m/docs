## 1. Kiểu `void` (Hàm không trả về giá trị)
`void` đại diện cho việc một hàm **không trả về bất kỳ giá trị nào** (hoặc không có lệnh `return` rõ ràng).

### Khác biệt tinh tế: `void` vs `undefined`
Trong JavaScript, một hàm không return gì thực tế sẽ trả về `undefined` khi runtime. Nhưng trong TypeScript, `void` và `undefined` có hành vi khác nhau ở khía cạnh kiểu dữ liệu:

* **Nếu hàm được định nghĩa trả về `undefined`**: Thân hàm bắt buộc phải có dòng `return undefined;` hoặc `return;` rõ ràng.
* **Nếu hàm được định nghĩa trả về `void`**: Thân hàm không cần lệnh return. 

```typescript
function doNothing(): void {
  // Không cần lệnh return nào
}

function doNothingAndReturn(): undefined {
  return; // Bắt buộc phải có lệnh return ở đây
}
```

> [!IMPORTANT]
> ### Hành vi đặc biệt của Callback kiểu `void` (Void Return Ignored)
> Khi bạn khai báo một chữ ký hàm nhận callback có kiểu trả về là `void` (ví dụ: `type Callback = () => void`), TypeScript cho phép bạn truyền vào một callback thực tế trả về một giá trị nào đó (giá trị đó sẽ bị bỏ qua). 
>
> Tuy nhiên, nếu bạn khai báo callback trả về `undefined` (`type Callback = () => undefined`), callback truyền vào bắt buộc phải trả về `undefined`.
>
> ```typescript
> function executeCallback(cb: () => void) { cb(); }
> 
> // ✅ Hợp lệ! Dù callback trả về number (123), TS vẫn chấp nhận và bỏ qua giá trị này.
> executeCallback(() => 123); 
> ```

---

## 2. Kiểu `unknown` (Kiểu dữ liệu an toàn thay thế `any`)
`unknown` đại diện cho bất kỳ giá trị nào. Nó giống như `any` ở chỗ bạn có thể gán bất kỳ thứ gì cho nó. 

Nhưng nó **an toàn hơn `any` rất nhiều**: Bạn không thể gọi phương thức, truy cập thuộc tính hoặc thực thi một biến có kiểu `unknown` trừ khi bạn thực hiện kiểm tra kiểu (Type Narrowing) trước đó.

### Ví dụ thực tế:
```typescript
function parseJSON(jsonString: string): unknown {
  return JSON.parse(jsonString); // Trả về unknown thay vì any để bắt người dùng check kiểu
}

const result = parseJSON('{ "name": "Alice" }');

// console.log(result.name); // ❌ Lỗi compile ngay: 'result' is of type 'unknown'.

// Bắt buộc phải check kiểu (Type Guard) trước khi dùng:
if (result && typeof result === "object" && "name" in result) {
  console.log((result as any).name); // ✅ Hợp lệ sau khi đã thu hẹp phạm vi kiểu
}
```

---

## 3. Kiểu `never` (Kiểu giá trị không bao giờ xảy ra)
`never` đại diện cho kiểu dữ liệu của các giá trị **không bao giờ có thể xảy ra**.

Trong hàm, kiểu trả về là `never` khi và chỉ khi hàm đó **không bao giờ kết thúc bình thường**. Có hai trường hợp phổ biến:
1. Hàm luôn luôn ném ra lỗi (Throw Error).
2. Hàm chạy vòng lặp vô hạn (Infinite Loop).

### Ví dụ thực tế:
```typescript
// 1. Hàm luôn luôn ném lỗi
function throwError(message: string): never {
  throw new Error(message); // Hàm dừng lại tại đây và không bao giờ return
}

// 2. Hàm có vòng lặp vô tận
function keepAlive(): never {
  while (true) {
    // Vòng lặp vô tận, không bao giờ kết thúc
  }
}
```

### Điểm khác biệt giữa `void` và `never`:
* `void`: Hàm chạy xong đầy đủ và **trở về** thành công, nhưng không đem theo giá trị nào.
* `never`: Hàm **không bao giờ có đường về** (bị chặn đứng giữa chừng hoặc chạy mãi mãi).
