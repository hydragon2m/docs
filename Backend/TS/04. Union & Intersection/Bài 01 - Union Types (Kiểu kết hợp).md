## 1. Union Types (Kiểu kết hợp) là gì?
Trong thực tế, một giá trị có thể thuộc nhiều định dạng khác nhau tùy thuộc vào ngữ cảnh (ví dụ: ID của người dùng có thể là một chuỗi UUID `string` hoặc một số tự tăng `number`).

Toán tử **`|`** (đọc là "hoặc" - OR) được sử dụng để tạo ra một **Union Type**, cho phép một biến nhận một trong nhiều kiểu dữ liệu được chỉ định.

```typescript
let id: string | number;
id = 101;          // ✅ Hợp lệ
id = "usr_99012";  // ✅ Hợp lệ
// id = true;      // ❌ Lỗi: Type 'boolean' is not assignable to type 'string | number'.
```

---

## 2. Quy tắc truy cập thuộc tính (Property Access on Unions)

> [!IMPORTANT]
> ### Quy tắc cốt lõi: Chỉ được truy cập thuộc tính CHUNG
> Nếu một giá trị có kiểu kết hợp (Union Type), bạn **chỉ được phép truy cập trực tiếp các thuộc tính hoặc phương thức xuất hiện ở TẤT CẢ các kiểu thành phần** của Union đó.
>
> Nếu muốn truy cập thuộc tính riêng lẻ của một kiểu thành phần cụ thể, bạn bắt buộc phải dùng các kỹ thuật **Type Narrowing** (Chương 3) để thu hẹp kiểu trước.

### Ví dụ thực tế:
```typescript
interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

function getPetActions(pet: Bird | Fish) {
  // ✅ Hợp lệ: layEggs() tồn tại ở cả Bird và Fish
  pet.layEggs(); 
  
  // ❌ Lỗi compile ngay lập tức!
  // pet.swim(); 
  // Lỗi: Property 'swim' does not exist on type 'Bird | Fish'. Property 'swim' does not exist on type 'Bird'.
}
```

---

## 3. Kiến thức nâng cao: Cú pháp phân biệt vị trí ngoặc vuông của Mảng

Khi kết hợp Union Types với Mảng (Array), vị trí đặt dấu ngoặc đơn `()` sẽ thay đổi hoàn toàn ý nghĩa kiểu dữ liệu. Đây là lỗi cú pháp rất dễ gây hiểu nhầm:

### Dạng 1: `(string | number)[]` (Mảng chứa hỗn hợp các phần tử)
Đại diện cho một mảng đơn lẻ, bên trong mảng đó có thể chứa cả số lẫn chữ.
```typescript
let list: (string | number)[] = ["Alice", 10, "Bob", 20]; // ✅ Hợp lệ
```

### Dạng 2: `string[] | number[]` (Hoặc mảng string, hoặc mảng number)
Đại diện cho một biến: hoặc là một mảng chỉ chứa toàn chuỗi, hoặc là một mảng chỉ chứa toàn số. Bạn không được phép trộn lẫn.
```typescript
let list2: string[] | number[] = ["Alice", "Bob"]; // ✅ Hợp lệ (toàn string)
list2 = [10, 20];                                 // ✅ Hợp lệ (toàn number)
// list2 = ["Alice", 10];                         // ❌ Lỗi compile!
```
