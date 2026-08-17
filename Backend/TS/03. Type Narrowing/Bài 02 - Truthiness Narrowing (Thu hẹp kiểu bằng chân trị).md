## 1. Truthiness (Chân trị) trong JavaScript là gì?
Trong JavaScript, bạn có thể đưa bất kỳ giá trị nào vào trong biểu thức điều kiện (như `if`, `&&`, `||`, hoặc toán tử phủ định `!`). JavaScript sẽ tự động ép kiểu giá trị đó về kiểu `boolean` (`true` hoặc `false`).

Các giá trị khi ép kiểu về `false` được gọi là **Falsy values**. Danh sách đầy đủ gồm:
* `0` (số không)
* `""` (chuỗi rỗng)
* `null`
* `undefined`
* `NaN`
* `0n` (bigint 0)
* `false`

Tất cả các giá trị còn lại nằm ngoài danh sách này đều sẽ được ép kiểu thành `true` (được gọi là **Truthy values**), bao gồm cả các mảng rỗng `[]` và đối tượng rỗng `{}`.

---

## 2. Truthiness Narrowing hoạt động như thế nào?
TypeScript sử dụng cơ chế ép kiểu chân trị này để loại bỏ các trường hợp dữ liệu bị `null` hoặc `undefined` ra khỏi kiểu dữ liệu kết hợp.

### Ví dụ thực tế:
```typescript
function printAll(strs: string | string[] | null) {
  // Loại trừ null bằng kiểm tra chân trị
  if (strs) { 
    // Trong block này, strs CHẮC CHẮN không bị null
    // Kiểu dữ liệu được thu hẹp còn: string | string[]
    if (typeof strs === "object") {
      strs.forEach(s => console.log(s)); // ✅ strs có kiểu string[]
    } else {
      console.log(strs); // ✅ strs có kiểu string
    }
  }
}
```

---

## 3. Các Cạm bẫy và Lỗi logic nghiêm trọng

> [!CAUTION]
> ### Bẫy lỗi: Vô tình chặn đứng các giá trị Falsy hợp lệ
> Đây là một trong những nguyên nhân gây ra bug logic phổ biến nhất. Khi bạn kiểm tra một biến bằng cách ép kiểu Truthiness, bạn cũng sẽ vô tình loại bỏ các giá trị hợp lệ nhưng có tính chất Falsy như số `0` hoặc chuỗi rỗng `""`.
>
> **Ví dụ lỗi:**
> ```typescript
> function printNumbers(count: number | undefined) {
>   if (count) {
>     console.log(`Số lượng: ${count}`);
>   }
> }
> 
> printNumbers(0); 
> // ❌ Hàm không in ra gì! Vì số 0 là Falsy, điều kiện 'if (count)' bị đánh giá là false. 
> // Nhưng số 0 là một đầu vào hoàn toàn hợp lệ!
> ```
>
> **Giải pháp khắc phục:**
> Tránh dùng kiểm tra chân trị trực tiếp `if (count)` cho số hoặc chuỗi nếu giá trị `0` hoặc `""` có ý nghĩa logic. Hãy so sánh tường minh:
> ```typescript
> function printNumbers(count: number | undefined) {
>   if (count !== undefined) {
>     console.log(`Số lượng: ${count}`); // ✅ Chạy đúng với count = 0
>   }
> }
> ```
