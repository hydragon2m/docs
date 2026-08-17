## 1. Toán tử `in` trong JavaScript là gì?
Toán tử **`in`** là một toán tử có sẵn trong JavaScript dùng để kiểm tra xem một đối tượng (hoặc các chuỗi nguyên mẫu của nó) có sở hữu một **thuộc tính (property)** có tên chỉ định hay không.

Cú pháp:
```typescript
"tên_thuộc_tính" in đối_tượng
```
Kết quả trả về sẽ là `true` hoặc `false`.

---

## 2. Dùng toán tử `in` để thu hẹp kiểu dữ liệu

TypeScript tận dụng toán tử này để thu hẹp các kiểu dữ liệu đối tượng dạng kết hợp (Union of Objects). Nếu bạn kiểm tra sự tồn tại của một thuộc tính độc nhất của một kiểu đối tượng, TypeScript sẽ biết được đối tượng thực tế thuộc kiểu nào.

### Ví dụ thực tế:
```typescript
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    // Chỉ có kiểu Fish mới có phương thức swim.
    // Do đó, animal ở đây được thu hẹp về kiểu Fish.
    return animal.swim(); // ✅ Hợp lệ
  }
  
  // animal ở ngoài nhánh if chắc chắn là kiểu Bird
  return animal.fly(); // ✅ Hợp lệ
}
```

---

## 3. Khía cạnh nâng cao và Cạm bẫy với thuộc tính tùy chọn (Optional Properties)

> [!WARNING]
> ### Cảnh báo: Sử dụng toán tử `in` với thuộc tính tùy chọn
> Cơ chế thu hẹp kiểu bằng `in` hoạt động cực kỳ chính xác nếu các thuộc tính bạn kiểm tra là **bắt buộc** ở kiểu này và **không tồn tại** ở kiểu kia.
>
> Tuy nhiên, nếu thuộc tính đó là **tùy chọn (optional)** ở cả hai kiểu hoặc một trong hai, toán tử `in` có thể sẽ không thể thu hẹp kiểu triệt để được.
>
> **Ví dụ thực tế:**
> ```typescript
> type Admin = { permissions: string[]; isSuper?: boolean };
> type Manager = { department: string; isSuper?: boolean };
> 
> function checkRole(user: Admin | Manager) {
>   if ("isSuper" in user) {
>     // ❌ TypeScript KHÔNG THỂ thu hẹp kiểu về Admin hay Manager được!
>     // Vì thuộc tính 'isSuper' tồn tại ở cả hai kiểu (dưới dạng optional).
>     // Kiểu của 'user' trong block này vẫn là 'Admin | Manager'.
>   }
> }
> ```
> Vì vậy, hãy tránh kiểm tra các thuộc tính chung hoặc thuộc tính optional để phân biệt các kiểu đối tượng. Hãy tìm các thuộc tính mang tính chất định danh độc nhất.
