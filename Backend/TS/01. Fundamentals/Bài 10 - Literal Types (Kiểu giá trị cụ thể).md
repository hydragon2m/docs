## 1. Literal Types là gì?
Ở các bài học trước, bạn đã học các kiểu dữ liệu chung như `string` (chấp nhận mọi chuỗi chữ), `number` (chấp nhận mọi số).

**Literal Types** là tính năng độc đáo của TypeScript cho phép bạn chỉ định **chính xác một hoặc nhiều giá trị cụ thể** làm kiểu dữ liệu cho một biến. Biến đó sẽ chỉ được phép chứa các giá trị cụ thể này và không được nhận bất kỳ giá trị nào khác.

---

## 2. Các loại Literal Types phổ biến

Bằng cách kết hợp Literal Types với toán tử kết hợp `|` (Union Type), chúng ta có thể tạo ra các tập hợp giá trị nghiêm ngặt:

### a. String Literal Types (Chuỗi cụ thể)
```typescript
type Direction = "North" | "South" | "East" | "West";

let heading: Direction = "North"; // ✅ Hợp lệ
// let heading: Direction = "Left";  // ❌ Lỗi: Type '"Left"' is not assignable to type 'Direction'.
```

### b. Number Literal Types (Số cụ thể)
```typescript
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

let result: DiceRoll = 3;  // ✅ Hợp lệ
// let result: DiceRoll = 10; // ❌ Lỗi: Type '10' is not assignable to type 'DiceRoll'.
```

### c. Boolean Literal Types (Đúng/Sai cụ thể)
```typescript
type State = true; // Chỉ chấp nhận duy nhất giá trị true
```

---

## 3. Các khía cạnh nâng cao và Bẫy lỗi lập trình

> [!CAUTION]
> ### Bẫy lỗi: Suy luận kiểu của Object Literal (Literal Inference)
> Khi bạn khai báo một đối tượng, TypeScript sẽ mặc định suy luận kiểu của các thuộc tính dạng rộng (ví dụ gán chuỗi thì hiểu là `string` chứ không phải là kiểu Literal cụ thể). Điều này dẫn đến lỗi khi truyền thuộc tính vào hàm nhận kiểu Literal.
>
> **Ví dụ lỗi:**
> ```typescript
> type Method = "GET" | "POST";
> 
> function handleRequest(url: string, method: Method) {
>   console.log(`Sending ${method} request to ${url}`);
> }
> 
> const req = {
>   url: "https://api.example.com",
>   method: "GET" // TypeScript suy luận kiểu của thuộc tính 'method' là 'string' chứ không phải kiểu "GET" cụ thể
> };
> 
> handleRequest(req.url, req.method); 
> // ❌ Lỗi compile: Argument of type 'string' is not assignable to parameter of type 'Method'.
> ```
>
> **Giải pháp khắc phục:**
> 
> **Cách 1: Ép kiểu hoặc khai báo kiểu rõ ràng cho đối tượng:**
> ```typescript
> const req: { url: string; method: Method } = {
>   url: "https://api.example.com",
>   method: "GET"
> };
> ```
> 
> **Cách 2: Sử dụng cú pháp `as const` (Readonly Literal - Khuyên dùng):**
> Khi thêm `as const` ở cuối đối tượng, TypeScript sẽ chuyển toàn bộ thuộc tính của đối tượng đó thành kiểu Literal chỉ đọc (`readonly`).
> ```typescript
> const req = {
>   url: "https://api.example.com",
>   method: "GET"
> } as const; // method bây giờ có kiểu chính xác là "GET" và ở trạng thái readonly
> 
> handleRequest(req.url, req.method); // ✅ Chạy hoàn hảo!
> ```

---

## 4. Kiến thức nâng cao cực hạn: Template Literal Types
Bắt đầu từ phiên bản TypeScript 4.1, bạn có thể sử dụng cú pháp dấu backtick `` ` `` để tạo ra các Literal Types động dựa trên các chuỗi String Literal khác. Cơ chế này giống như việc nối chuỗi (String Interpolation) trong JavaScript nhưng được thực hiện **ngay ở mức kiểu dữ liệu**.

### Ví dụ 1: Tổ hợp các thuộc tính CSS
```typescript
type VerticalAlignment = "top" | "middle" | "bottom";
type HorizontalAlignment = "left" | "center" | "right";

// TypeScript tự động sinh ra kiểu tổ hợp gồm 9 chuỗi khả dĩ:
// "top-left" | "top-center" | "top-right" | "middle-left" | ...
type Alignment = `${VerticalAlignment}-${HorizontalAlignment}`;

let myAlignment: Alignment = "top-center"; // ✅ Hợp lệ
// let myAlignment: Alignment = "top-top";     // ❌ Lỗi biên dịch!
```

### Ví dụ 2: Định nghĩa sự kiện động (Event Listeners)
Đây là kỹ thuật thường gặp khi viết các thư viện Event Emitter nâng cao:
```typescript
type Entity = "User" | "Product";
type EventType = "Created" | "Updated" | "Deleted";

// Tạo kiểu động: "onUserCreated" | "onUserUpdated" | ...
type EntityEvent = `on${Entity}${EventType}`;

function registerHandler(event: EntityEvent) {
  console.log(`Đang lắng nghe sự kiện: ${event}`);
}

registerHandler("onUserCreated"); // ✅ Hợp lệ
// registerHandler("onUserLogged");  // ❌ Lỗi compile!
```
