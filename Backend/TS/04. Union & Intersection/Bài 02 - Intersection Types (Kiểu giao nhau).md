## 1. Intersection Types (Kiểu giao nhau) là gì?
Trong khi Union Type (`|`) hoạt động theo nguyên lý "hoặc" (chọn một trong nhiều kiểu), thì **Intersection Type** sử dụng toán tử **`&`** (đọc là "và" - AND) hoạt động theo nguyên lý **gộp chung**. 

Intersection Type cho phép bạn kết hợp nhiều kiểu dữ liệu sẵn có lại để tạo ra một kiểu dữ liệu mới chứa **toàn bộ thuộc tính và phương thức** của các kiểu cấu phần.

---

## 2. Áp dụng Intersection trên Object Types (Kiểu đối tượng)

Đây là trường hợp ứng dụng phổ biến nhất của Intersection. Nó hoạt động tương tự như việc kế thừa (`extends`) của Interface:

```typescript
interface PersonalInfo {
  name: string;
  age: number;
}

interface ContactInfo {
  email: string;
  phone: string;
}

// Kiểu Employee bắt buộc phải chứa đầy đủ thuộc tính của cả hai Interface trên
type Employee = PersonalInfo & ContactInfo;

const emp: Employee = {
  name: "John Doe",
  age: 30,
  email: "john@example.com",
  phone: "0901234567" // ✅ Đầy đủ thuộc tính mới hợp lệ
};
```

---

## 3. Kiến thức nâng cao và Cạm bẫy lỗi kiểu dữ liệu

> [!CAUTION]
> ### 1. Giao nhau giữa các kiểu Nguyên thủy (Primitive Intersection)
> Điều gì xảy ra nếu bạn cố tình thực hiện phép giao nhau giữa hai kiểu dữ liệu nguyên thủy hoàn toàn khác nhau (như `string` và `number`)?
>
> ```typescript
> type Impossible = string & number;
> ```
> Vì không có bất kỳ giá trị nào vừa là một chuỗi chữ vừa là một con số tại cùng một thời điểm, TypeScript sẽ tự động quy đổi kiểu `Impossible` này về kiểu **`never`**.

> [!IMPORTANT]
> ### 2. Xung đột kiểu của thuộc tính trùng tên (Property Type Conflicts)
> Khi bạn giao nhau giữa hai đối tượng có chung một tên thuộc tính nhưng thuộc tính đó có kiểu dữ liệu khác nhau, TypeScript sẽ thực hiện phép giao nhau **trên thuộc tính đó**. 
>
> Nếu thuộc tính đó là kiểu nguyên thủy, kiểu của thuộc tính đó sẽ biến thành `never`, làm cho toàn bộ đối tượng không thể gán giá trị được nữa.
>
> **Ví dụ thực tế:**
> ```typescript
> interface X {
>   id: string; // id có kiểu string
> }
> interface Y {
>   id: number; // id có kiểu number
> }
> 
> type XY = X & Y; // id của XY có kiểu: string & number (tức là never)
> 
> // ❌ Lỗi compile lập tức khi gán:
> // const obj: XY = {
> //   id: "101" // Lỗi: Type 'string' is not assignable to type 'never'.
> // };
> ```
