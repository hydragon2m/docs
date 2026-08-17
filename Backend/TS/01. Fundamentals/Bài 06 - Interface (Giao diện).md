## 1. Interface là gì?
**Interface (Giao diện)** là một công cụ mạnh mẽ trong TypeScript được sử dụng để định nghĩa cấu trúc (shape) của một đối tượng (Object) hoặc lớp (Class). 

Interface đóng vai trò như một **bản hợp đồng (contract)**. Bất kỳ đối tượng nào tuân theo interface đó đều bắt buộc phải triển khai đầy đủ các thuộc tính và phương thức đã cam kết.

---

## 2. Cú pháp cơ bản
Để khai báo một interface, ta sử dụng từ khóa `interface` theo sau là tên giao diện viết bằng quy chuẩn **PascalCase** và danh sách thuộc tính bên trong dấu ngoặc nhọn `{}`.

```typescript
interface User {
  name: string;
  age: number;
  greet(): void; // Khai báo phương thức của đối tượng
}

const user: User = {
  name: "Alice",
  age: 25,
  greet() {
    console.log(`Xin chào, tôi là ${this.name}`);
  }
};
```

---

## 3. Các khía cạnh nâng cao của Interface

### a. Kế thừa Interface (`extends`)
Một interface có thể kế thừa từ một hoặc nhiều interface khác bằng từ khóa `extends`. Điều này giúp chia nhỏ cấu trúc dữ liệu và tăng khả năng tái sử dụng.

```typescript
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string; // Kế thừa thuộc tính 'name' và tự khai báo thêm 'breed'
}

const myDog: Dog = {
  name: "Lucky",
  breed: "Husky"
};
```

### b. Gộp khai báo (Declaration Merging)
Đây là đặc điểm độc nhất của `interface` so với `type`. Nếu bạn khai báo nhiều interface trùng tên trong cùng một scope, TypeScript sẽ tự động **gộp (merge)** tất cả các thuộc tính của chúng lại với nhau.

```typescript
interface Album {
  title: string;
}

interface Album {
  releaseYear: number; // Tự động gộp vào interface Album ở trên
}

// Đối tượng Album bắt buộc phải có cả hai thuộc tính
const myAlbum: Album = {
  title: "Vũ trụ song song",
  releaseYear: 2024
};
```

### c. Phạm vi hoạt động (Scope) của cơ chế Gộp khai báo
Một câu hỏi quan trọng đặt ra là: **"Phạm vi (scope) này được tính theo từng file riêng lẻ hay trên toàn bộ dự án?"** 

Câu trả lời phụ thuộc vào việc file đó được TypeScript hiểu là một **Script (Global)** hay một **Module**:

* **Trường hợp 1: File Script (Không dùng `import` / `export`)**
  Nếu file của bạn **không chứa bất kỳ dòng `import` hay `export` nào**, TypeScript mặc định coi đây là một file Script thông thường chạy trên môi trường **Global Scope (Toàn cục)**. 
  Do đó, nếu bạn khai báo `interface User` ở `fileA.ts` và `interface User` ở `fileB.ts`, TypeScript sẽ **tự động gộp chúng lại với nhau trên phạm vi toàn bộ dự án**.

* **Trường hợp 2: File Module (Có dùng `import` / `export`)**
  Nếu file của bạn chứa ít nhất một từ khóa `import` hoặc `export` (ví dụ: `export {};` ở cuối file), file này sẽ chạy dưới dạng **Module Scope (Cục bộ theo file)**.
  Lúc này, các interface trùng tên ở các file khác nhau sẽ hoàn toàn cô lập, **không tự động gộp**. Muốn gộp khai báo, chúng bắt buộc phải nằm trong cùng một file vật lý hoặc bạn phải khai báo mở rộng khối toàn cục bằng cú pháp `declare global`.

---

## 4. Bảng so sánh chi tiết: Interface vs Type Alias

Đây là một câu hỏi phỏng vấn kinh điển và là kiến thức bắt buộc phải nắm rõ:

| Đặc điểm                     | Interface                                         | Type Alias                                                                  |
| :--------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------- |
| **Mục đích chính**           | Chuyên dùng định nghĩa cấu trúc Object / Class    | Định nghĩa bí danh cho bất kỳ kiểu nào (Object, Primitive, Union, Tuple...) |
| **Kế thừa**                  | Dùng từ khóa `extends`                            | Dùng toán tử gộp kiểu `&` (Intersection)                                    |
| **Gộp khai báo (Merging)**   | ✅ Có (Tự động gộp nếu trùng tên)                  | ❌ Không (Báo lỗi trùng định danh ngay lập tức)                              |
| **Kiểu nguyên thủy / Union** | ❌ Không thể đại diện cho kiểu đơn lẻ như `string` | ✅ Có thể (`type ID = string \| number`)                                     |

---

## 5. Các lưu ý quan trọng và lỗi thường gặp

> [!IMPORTANT]
> ### 1. Lỗi xung đột kiểu khi Gộp khai báo (Declaration Merging Conflict)
> Khi gộp khai báo, các thuộc tính trùng tên phải có **kiểu dữ liệu giống nhau**. Nếu khai báo khác kiểu, TypeScript sẽ báo lỗi biên dịch lập tức.
> ```typescript
> interface User { id: number; }
> interface User { id: string; } // ❌ Lỗi: Subsequent property declarations must have the same type.
> ```
>
> ### 2. Interface chỉ tồn tại ở Compile-time
> Tương tự như Type Alias, Interface hoàn toàn biến mất sau khi biên dịch sang JavaScript. Không có class hay object thực tế nào được tạo ra ở runtime từ interface.
>
> ### 3. Khi nào dùng cái nào? (Best Practice)
> * **Ưu tiên dùng `interface`:** Khi bạn định nghĩa cấu trúc đối tượng công cộng (Public APIs) hoặc khi viết thư viện, vì người dùng khác có thể tận dụng tính năng Declaration Merging để mở rộng kiểu.
> * **Ưu tiên dùng `type`:** Khi cần định nghĩa Union types (`type Status = "active" | "inactive"`), Tuples, hoặc các kiểu dữ liệu nguyên thủy phức tạp khác mà `interface` không làm được.
