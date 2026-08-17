## 1. Type Narrowing (Thu hẹp kiểu dữ liệu) là gì?
Trong TypeScript, một biến thường được khai báo với một kiểu dữ liệu rộng đại diện cho nhiều khả năng khác nhau (ví dụ: `string | number`, `User | Admin`, hoặc `any`).

**Type Narrowing** là quá trình TypeScript phân tích dòng chảy kiểm tra điều kiện trong mã nguồn (Control Flow Analysis) để **tự động thu hẹp kiểu dữ liệu rộng thành một kiểu cụ thể hơn** bên trong nhánh điều kiện đó.

Ví dụ:
```typescript
function paddingLeft(value: string | number, padding: string) {
  // Ngoài này value có thể là string hoặc number
  
  if (typeof value === "number") {
    // Trong này, TypeScript tự động hiểu value CHẮC CHẮN là number
    return " ".repeat(value) + padding;
  }
  
  // Ngoài này, TypeScript tự động hiểu value CHẮC CHẮN là string (vì nếu là number đã return ở trên)
  return value + padding;
}
```

---

## 2. typeof Type Guards là gì?
**`typeof`** là một toán tử có sẵn của JavaScript. Khi chạy ở runtime, nó trả về một chuỗi văn bản đại diện cho kiểu cơ bản của giá trị được kiểm tra.

TypeScript tích hợp trực tiếp với toán tử này để biến nó thành một **Type Guard (Bộ canh phòng kiểu dữ liệu)**. Khi bạn dùng `typeof` trong câu lệnh điều kiện `if`, TypeScript sẽ đọc câu lệnh đó và tự động thu hẹp kiểu dữ liệu bên trong block `{}` tương ứng.

---

## 3. Các giá trị trả về của `typeof` hợp lệ

JavaScript chỉ định nghĩa một số chuỗi kết quả cố định cho toán tử `typeof`. TypeScript chỉ thực hiện thu hẹp kiểu nếu bạn so sánh với các chuỗi này:

1. `"string"`
2. `"number"`
3. `"bigint"`
4. `"boolean"`
5. `"symbol"`
6. `"undefined"`
7. `"object"`
8. `"function"`

---

## 4. Cạm bẫy quan trọng với `typeof null`

> [!CAUTION]
> ### Lỗi lịch sử của JavaScript: `typeof null === "object"`
> Trong JavaScript, do một lỗi thiết kế từ phiên bản đầu tiên, `typeof null` sẽ trả về chuỗi `"object"`. 
>
> Do đó, nếu bạn dùng `typeof value === "object"` để thu hẹp kiểu, TypeScript sẽ **không loại trừ khả năng biến đó bị `null`**. Bạn bắt buộc phải kiểm tra khác `null` trước khi truy cập thuộc tính của đối tượng.
>
> **Ví dụ lỗi:**
> ```typescript
> function printLength(opts: { length: number } | null) {
>   if (typeof opts === "object") {
>     // ❌ Lỗi compile: 'opts' is possibly 'null'.
>     console.log(opts.length); 
>   }
> }
> ```
>
> **Ví dụ ĐÚNG (Kiểm tra khác null trước):**
> ```typescript
> function printLength(opts: { length: number } | null) {
>   if (opts !== null && typeof opts === "object") {
>     console.log(opts.length); // ✅ Hợp lệ!
>   }
> }
> ```
