## 1. Khái niệm Subtyping và Tương thích kiểu (Type Compatibility)
TypeScript sử dụng hệ thống kiểu cấu trúc (Structural Typing). Mối quan hệ tương thích kiểu được quyết định bởi cấu trúc thực tế của dữ liệu chứ không phải bởi danh tính khai báo.

Trong ngữ cảnh Union và Intersection:
* **Union Type (`|`)**: Tạo ra một kiểu dữ liệu **rộng hơn**. Một kiểu con cụ thể (ví dụ: `string`) luôn luôn có thể gán được cho kiểu kết hợp chứa nó (ví dụ: `string | number`).
* **Intersection Type (`&`)**: Tạo ra một kiểu dữ liệu **hẹp hơn và cụ thể hơn**. Một đối tượng giao nhau (ví dụ: `Admin & Manager`) luôn có thể gán cho một biến kiểu thành phần đơn lẻ (ví dụ: `Admin`), nhưng chiều ngược lại thì không.

### Ví dụ gán:
```typescript
let value: string | number;
let text: string = "hello";

value = text; // ✅ Hợp lệ (hợp kiểu rộng nhận kiểu hẹp)
// text = value; // ❌ Lỗi compile! Một giá trị string | number không thể gán trực tiếp cho string.
```

---

## 2. Cơ chế mở rộng kiểu (Type Widening)
Khi bạn khai báo một biến bằng từ khóa `let` hoặc `var` và gán giá trị literal cho nó, TypeScript sẽ tự động **mở rộng kiểu (widen)** của biến đó từ kiểu Literal cụ thể sang kiểu nguyên thủy chung tương ứng. Điều này cho phép bạn gán các giá trị khác cho biến đó sau này.

```typescript
let x = "hello"; // TypeScript suy luận kiểu của 'x' là 'string' (Widening)
x = "world";     // ✅ Hợp lệ
```
Nếu bạn sử dụng `const`, TypeScript hiểu biến này sẽ không bao giờ thay đổi giá trị và giữ nguyên kiểu Literal:
```typescript
const y = "hello"; // TypeScript suy luận kiểu của 'y' chính xác là kiểu literal "hello"
```

---

## 3. Cạm bẫy Type Widening trong Object và Union

> [!CAUTION]
> ### Sự mở rộng kiểu của thuộc tính đối tượng
> Khi thuộc tính của một đối tượng được gán trực tiếp, TypeScript sẽ tự động mở rộng kiểu của thuộc tính đó thành kiểu nguyên thủy chung (`string`, `number`...). 
>
> Điều này gây lỗi khi bạn muốn thuộc tính đó phải mang kiểu kết hợp của các chuỗi literal cụ thể.
>
> **Ví dụ thực tế lỗi:**
> ```typescript
> type ActionType = "CREATE" | "DELETE";
> 
> function runAction(action: ActionType) { ... }
> 
> const req = {
>   action: "CREATE" // TypeScript tự động widen kiểu của action thành 'string'
> };
> 
> // runAction(req.action); 
> // ❌ Lỗi compile: Argument of type 'string' is not assignable to parameter of type 'ActionType'.
> ```
>
> **Giải pháp khắc phục (Ngăn chặn Widening):**
> 
> **Cách 1: Khai báo kiểu tường minh cho đối tượng:**
> ```typescript
> const req: { action: ActionType } = { action: "CREATE" };
> ```
> 
> **Cách 2: Sử dụng `as const` (Readonly Literal):**
> ```typescript
> const req = { action: "CREATE" } as const; // Khóa kiểu của thuộc tính thành đúng literal "CREATE"
> ```
