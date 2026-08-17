## 1. Tham số tùy chọn (Optional Parameters)
Trong JavaScript, bạn có thể gọi một hàm với bất kỳ số lượng đối số nào. Nếu thiếu đối số, giá trị của tham số tương ứng trong hàm sẽ mặc định là `undefined`.

TypeScript yêu cầu bạn phải truyền đầy đủ tham số đã khai báo. Để cho phép một tham số có thể bỏ qua khi gọi hàm, ta sử dụng dấu hỏi chấm `?` sau tên tham số.

### Cú pháp và Quy tắc:
* Tham số tùy chọn **bắt buộc phải đứng sau** các tham số bắt buộc.

```typescript
function greet(firstName: string, lastName?: string): string {
  if (lastName) {
    return `Hello, ${firstName} ${lastName}`;
  }
  return `Hello, ${firstName}`;
}

greet("John");          // ✅ Hợp lệ
greet("John", "Doe");   // ✅ Hợp lệ
```

### Bản chất của Optional:
Kiểu dữ liệu của tham số `lastName?: string` thực chất sẽ được TypeScript hiểu là `string | undefined`.

---

## 2. Tham số mặc định (Default Parameters)
Thay vì chỉ đơn giản cho phép bỏ qua và nhận giá trị `undefined`, bạn có thể gán sẵn một **giá trị mặc định** cho tham số bằng dấu bằng `=`. Nếu người gọi không truyền giá trị hoặc truyền giá trị là `undefined`, hàm sẽ tự động lấy giá trị mặc định này.

### Cú pháp:
```typescript
function multiply(value: number, factor: number = 2): number {
  return value * factor;
}

console.log(multiply(5));    // Output: 10 (factor lấy giá trị mặc định là 2)
console.log(multiply(5, 3)); // Output: 15
```

### Suy luận kiểu (Type Inference):
Khi bạn viết `factor = 2`, TypeScript sẽ tự động suy luận kiểu dữ liệu của `factor` là `number` mà bạn không cần phải viết `factor: number = 2`.

---

## 3. Các khía cạnh nâng cao và Bẫy lỗi lập trình

> [!IMPORTANT]
> ### 1. Tham số mặc định đứng trước tham số bắt buộc
> Dù khuyến khích đặt tham số mặc định ở cuối, TypeScript vẫn cho phép đặt tham số mặc định ở trước các tham số bắt buộc. 
>
> Tuy nhiên, để bỏ qua tham số đó và sử dụng giá trị mặc định, người gọi **bắt buộc phải truyền giá trị `undefined` một cách tường minh**.
>
> ```typescript
> function createUser(role: string = "User", name: string): void {
>   console.log(`Role: ${role}, Name: ${name}`);
> }
> 
> // createUser("Alice"); // ❌ Lỗi compile! Tham số bắt buộc 'name' bị thiếu.
> createUser(undefined, "Alice"); // ✅ Hợp lệ! Output: Role: User, Name: Alice
> ```

> [!WARNING]
> ### 2. Tránh nhầm lẫn giữa Optional và Default trong kiểu dữ liệu
> Khi thiết kế kiểu dữ liệu cho hàm (Function Type Expressions), tham số có giá trị mặc định sẽ được biểu diễn dưới dạng **tham số tùy chọn (`?`)**.
>
> ```typescript
> // Cả hai hàm dưới đây đều có chung chữ ký kiểu hàm là: (a: number, b?: number) => number
> function add(a: number, b?: number) { ... }
> function multiply(a: number, b = 1) { ... }
> ```
