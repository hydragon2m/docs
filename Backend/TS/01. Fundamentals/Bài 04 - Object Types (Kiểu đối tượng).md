## 1. Object Types là gì?
Trong JavaScript, đối tượng (Object) là tập hợp các cặp key-value cực kỳ linh hoạt. Sự linh hoạt này là một con dao hai lưỡi: nó dễ dẫn đến các lỗi ngớ ngẩn như gõ sai tên thuộc tính, truy cập thuộc tính không tồn tại, hoặc gán sai kiểu dữ liệu.

Trong TypeScript, **Object Types** giải quyết triệt để vấn đề này bằng cách cho phép bạn định nghĩa chính xác **cấu trúc (shape)** của một đối tượng: gồm những thuộc tính bắt buộc nào, kiểu dữ liệu của từng thuộc tính là gì.

---

## 2. Cú pháp cơ bản
Để định nghĩa kiểu dữ liệu cho một đối tượng, chúng ta sử dụng dấu ngoặc nhọn `{}` và khai báo danh sách các thuộc tính bên trong. Các thuộc tính có thể cách nhau bởi dấu chấm phẩy `;` hoặc dấu phẩy `,`.

```typescript
let user: { name: string; age: number } = {
  name: "Alice",
  age: 25,
};
```

---

## 3. Các tính chất và tính năng nâng cao của Object Types

### a. Đối tượng lồng nhau (Nested Objects)
TypeScript hoàn toàn hỗ trợ bạn định nghĩa kiểu cho các đối tượng phức tạp có nhiều tầng lồng nhau:

```typescript
let employee: {
  id: number;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
  department: string;
} = {
  id: 101,
  personalInfo: {
    firstName: "John",
    lastName: "Doe",
  },
  department: "IT",
};
```

---

### b. Index Signatures (Thuộc tính động)
Có những trường hợp bạn không biết trước đối tượng sẽ có những key cụ thể nào khi lập trình, nhưng bạn biết định dạng chung của các key và value đó (ví dụ: một từ điển dịch thuật, hoặc cấu hình config).

Cú pháp **Index Signatures** giúp bạn định nghĩa kiểu cho các thuộc tính động:

```typescript
let translation: { [key: string]: string } = {
  hello: "Xin chào",
  goodbye: "Tạm biệt",
  // Bạn có thể thêm bao nhiêu thuộc tính tuỳ ý, miễn là key có kiểu string và value có kiểu string
};
```

---

### c. Phân biệt `object` vs `{}` vs `Object`
Đây là phần gây lầm tưởng và bối rối lớn nhất cho người mới học TypeScript:

| Kiểu dữ liệu | Ý nghĩa | Cho phép gán | Không cho phép gán |
| :--- | :--- | :--- | :--- |
| **`object`** (viết thường) | Đại diện cho bất kỳ giá trị nào **không phải là kiểu nguyên thủy** (non-primitive). | `{ x: 1 }`, `[]`, `function() {}` | `42`, `"hello"`, `true`, `null`, `undefined` |
| **`{}`** (ngoặc nhọn rỗng) | Đại diện cho bất kỳ giá trị nào **có thể truy cập được các phương thức của Object** (ngoại trừ `null` và `undefined`). | Gần như mọi thứ: `{}`, `42`, `"hello"`, `[]` | `null`, `undefined` |
| **`Object`** (viết hoa) | Tương tự như `{}`. Đây là kiểu mô tả các chức năng của class `Object` trong JS. | Mọi thứ (trừ `null` và `undefined`) | `null`, `undefined` |

> [!CAUTION]
> **Quy tắc vàng:**
> - Luôn sử dụng cú pháp mô tả cấu trúc cụ thể: `{ name: string }` khi bạn biết rõ cấu trúc đối tượng.
> - Sử dụng `object` (viết thường) khi bạn chỉ muốn biến đó phải là một Object / Array / Function (không cho phép gán số, chuỗi...).
> - **Tránh xa** việc sử dụng `{}` và `Object` làm kiểu dữ liệu vì chúng quá lỏng lẻo và hầu như không mang lại sự an toàn kiểu dữ liệu.

---

## 4. Sự nghiêm ngặt của TypeScript với Object Types

Khi bạn đã khai báo cấu trúc cho một Object, TypeScript sẽ thực thi kiểm tra rất nghiêm ngặt:

1. **Không được thiếu thuộc tính:** Thiếu bất kỳ thuộc tính nào đã khai báo trong cấu trúc sẽ báo lỗi.
2. **Không được thừa thuộc tính (Excess Property Checking):** Khi khai báo trực tiếp (Object Literal), bạn không được thêm thuộc tính lạ.
   ```typescript
   let user: { name: string; age: number } = {
     name: "Alice",
     age: 25,
     email: "alice@gmail.com", // ❌ Lỗi ngay: Object literal may only specify known properties
   };
   ```
3. **Không được sai kiểu thuộc tính:** Giá trị gán cho thuộc tính phải khớp với kiểu đã định nghĩa.

---

## 5. Ứng dụng Object Types trong Hàm
Bạn định nghĩa kiểu cấu trúc đối tượng ngay tại tham số nhận vào của hàm:

```typescript
function printCoordinates(pt: { x: number; y: number }): void {
  console.log(`Tọa độ: (${pt.x}, ${pt.y})`);
}

printCoordinates({ x: 10, y: 20 }); // ✅ Hợp lệ
```
