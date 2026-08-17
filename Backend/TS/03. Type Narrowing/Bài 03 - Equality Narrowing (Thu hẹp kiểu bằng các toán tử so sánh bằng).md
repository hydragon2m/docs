## 1. Khái niệm cơ bản
TypeScript không chỉ kiểm tra kiểu dữ liệu thông qua các hàm kiểm tra hoặc toán tử `typeof`. Nó còn sử dụng các câu lệnh so sánh bằng như **`===`**, **`!==`**, **`==`**, và **`!=`** để thực hiện **Equality Narrowing (Thu hẹp kiểu bằng phép so sánh bằng)**.

---

## 2. Cách hoạt động

### a. So sánh hai biến với nhau
Khi bạn so sánh hai biến có kiểu dữ liệu khác nhau bằng toán tử `===`, TypeScript sẽ phân tích xem hai biến đó có thể có chung kiểu dữ liệu nào hay không, và tự động ép cả hai về kiểu dữ liệu chung đó bên trong block điều kiện.

```typescript
function checkValues(x: string | number, y: string | boolean) {
  if (x === y) {
    // Để x === y xảy ra, x và y bắt buộc phải có cùng giá trị và cùng kiểu dữ liệu.
    // Kiểu duy nhất có thể chung giữa chúng là 'string'.
    // Do đó, trong block này x và y đều được thu hẹp về kiểu 'string'.
    console.log(x.toUpperCase()); // ✅ Hợp lệ
    console.log(y.toUpperCase()); // ✅ Hợp lệ
  }
}
```

---

### b. So sánh trực tiếp với một giá trị cụ thể
```typescript
function handleStatus(status: "success" | "failed" | null) {
  if (status !== null) {
    // status được thu hẹp còn: "success" | "failed"
    if (status === "success") {
      // status chắc chắn là kiểu literal "success"
    }
  }
}
```

---

## 3. Phép so sánh lỏng (`==` và `!=`) và Mẹo viết code sạch

Trong JavaScript, phép so sánh lỏng `==` và `!=` thực hiện ép kiểu tự động và thường bị khuyến cáo tránh dùng. 

Tuy nhiên, có một trường hợp đặc biệt mà phép so sánh lỏng cực kỳ hữu dụng và được khuyến khích sử dụng vì tính ngắn gọn: **Kiểm tra đồng thời cả `null` và `undefined`**.

> [!IMPORTANT]
> ### Quy tắc ép kiểu của `== null`
> Trong JavaScript, biểu thức `value == null` sẽ trả về `true` nếu `value` là **`null` hoặc `undefined`**. 
> Ngược lại, `value != null` trả về `true` nếu `value` khác cả `null` và `undefined`.
>
> TypeScript hiểu hoàn toàn quy tắc này và sẽ thu hẹp kiểu một cách chính xác:
>
> ```typescript
> function process(data: string | null | undefined) {
>   if (data != null) {
>     // data được loại bỏ cả null và undefined, chỉ còn lại kiểu 'string'
>     console.log(data.toLowerCase()); // ✅ Hợp lệ
>   }
> }
> ```
