## I. KHÁI QUÁT (OVERVIEW)

Trong TypeScript, hệ thống kiểu dữ liệu tĩnh hoạt động dựa trên cơ chế phân tích mã nguồn (Static Analysis) trước khi biên dịch. Tuy nhiên, trong thực tế, sẽ có những trường hợp trình biên dịch TypeScript không thể tự suy luận được kiểu dữ liệu hoặc suy luận ra kiểu dữ liệu quá chung chung (như `any`, `unknown`, hoặc `EventTarget`), trong khi bạn - nhà phát triển - biết chắc chắn 100% kiểu dữ liệu cụ thể của đối tượng đó.

Để giải quyết vấn đề này, TypeScript cung cấp tính năng **Type Assertions (Khẳng định kiểu)** và toán tử **Non-null Assertion (Khẳng định không null)**. Chúng cho phép bạn nói với trình biên dịch rằng: *"Hãy tin tôi, tôi biết rõ kiểu dữ liệu của biến này hơn bạn, hãy đối xử với nó như kiểu dữ liệu tôi chỉ định"*.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Cú pháp Type Assertions
TypeScript cung cấp hai cú pháp tương đương để thực hiện khẳng định kiểu:

```typescript
// Cách 1: Sử dụng từ khóa 'as' (Khuyên dùng vì không bị xung đột với cú pháp JSX/React)
const rawData: any = "Hello TypeScript";
const strLength: number = (rawData as string).length;

// Cách 2: Sử dụng cú pháp dấu ngoặc nhọn `<Type>`
const strLength2: number = (<string>rawData).length;
```

> [!CAUTION]
> **Điểm khác biệt chí mạng giữa Assertion và Casting (Ép kiểu):**
> *   **Casting (Ép kiểu thực tế):** Thay đổi kiểu dữ liệu của đối tượng ngay tại Runtime (Ví dụ: `Number("123")` biến chuỗi thành số thực sự).
> *   **Type Assertion (Khẳng định kiểu):** Chỉ là một lời hứa với TypeScript Compiler ở Compile-time. Khi biên dịch sang JavaScript, từ khóa `as` sẽ **bị xóa bỏ hoàn toàn** và không có bất kỳ logic kiểm tra hay chuyển đổi dữ liệu nào diễn ra ở Runtime.
> 
> Nếu bạn khẳng định sai kiểu dữ liệu, ứng dụng sẽ crash ở Runtime:
> ```typescript
> const value: any = 123;
> // TypeScript tin bạn, nhưng Runtime sẽ crash vì số không có phương thức toLowerCase()
> const result = (value as string).toLowerCase(); // ❌ Runtime Error: value.toLowerCase is not a function
> ```

---

### 2. Kỹ thuật Khẳng định kép (Double Assertion)
Mặc định, TypeScript chỉ cho phép bạn khẳng định kiểu dữ liệu nếu kiểu nguồn và kiểu đích có mối quan hệ tương thích (một kiểu là cha/con hoặc có chung thuộc tính với kiểu kia).

```typescript
const count = 42;
// const str = count as string; // ❌ Lỗi biên dịch: Conversion of type 'number' to type 'string' may be a mistake
```

Để ép kiểu giữa hai đối tượng hoàn toàn không liên quan, bạn phải đi qua kiểu trung gian là `any` hoặc `unknown` (gọi là **Double Assertion**):

```typescript
const count = 42;
const str = (count as unknown) as string; // ✅ Hợp lệ về mặt cú pháp biên dịch (Nhưng hãy cực kỳ cẩn thận!)
```

---

### 3. Toán tử Khẳng định Không Null/Undefined (Non-null Assertion Operator)
Khi cấu hình `"strictNullChecks": true`, TypeScript sẽ bắt bạn xử lý trường hợp một biến có thể là `null` hoặc `undefined`. Nếu bạn chắc chắn biến đó đã được gán giá trị tại thời điểm gọi, bạn có thể dùng toán tử `!` đặt sau tên biến để loại bỏ kiểu `null` và `undefined`.

```typescript
interface User {
  profile?: {
    name: string;
  };
}

function printName(user: User) {
  // Toán tử '!' khẳng định chắc chắn user.profile tồn tại
  const name = user.profile!.name; 
  console.log(name);
}
```

> [!WARNING]
> **Rủi ro cực lớn:** Nếu tại Runtime `user.profile` thực sự là `undefined`, dòng code trên sẽ ném ra lỗi `TypeError: Cannot read properties of undefined (reading 'name')` và làm sập ứng dụng. Hãy chỉ dùng `!` khi bạn thực sự kiểm soát được vòng đời của biến.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Sử dụng Assertions khi lấy dữ liệu từ API hoặc JSON.parse
Kết quả của `JSON.parse` luôn trả về kiểu `any`. Chúng ta cần đưa nó về kiểu dữ liệu có cấu trúc để đảm bảo Type-safety cho các dòng code phía sau:

```typescript
interface ApiResponse {
  status: "success" | "error";
  data: {
    userId: string;
    role: string;
  };
}

function handleUserData(jsonString: string) {
  // Khẳng định dữ liệu trả về khớp với cấu trúc ApiResponse
  const response = JSON.parse(jsonString) as ApiResponse;

  if (response.status === "success") {
    console.log(`User ID: ${response.data.userId}`); // Tự động autocomplete và kiểm soát kiểu dữ liệu
  }
}
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & CORE RULES)

### 1. Thay thế Assertions bằng Type Guards (An toàn hơn)
Thay vì nhắm mắt hứa với trình biên dịch bằng `as`, hãy sử dụng các hàm kiểm tra kiểu thực tế (Type Guards) để đảm bảo an toàn cả ở Runtime:

```typescript
// Cực kỳ nguy hiểm ❌
function processValue(val: any) {
  const result = (val as string).trim();
}

// An toàn tuyệt đối ở cả Compile-time và Runtime ✅
function processValueSafe(val: unknown) {
  if (typeof val === "string") {
    const result = val.trim(); // TypeScript tự động Narrowing kiểu của val về string
  }
}
```

### 2. Sự khác biệt giữa Type Assertion vs Type Annotation

| Tiêu chí | Type Annotation (Khai báo kiểu) | Type Assertion (Khẳng định kiểu) |
| :--- | :--- | :--- |
| **Cú pháp** | `let x: string = "hello"` | `let x = y as string` |
| **Vai trò** | Chỉ định kiểu nghiêm ngặt từ đầu | Ép trình biên dịch chấp nhận kiểu dữ liệu mới |
| **Tính an toàn** | Rất cao, phát hiện lỗi gán sai ngay lập tức | Thấp hơn, có thể che giấu lỗi biên dịch nhưng gây crash runtime |

---

## 💡 5 QUY TẮC VÀNG KHI SỬ DỤNG ASSERTIONS
1.  **Hạn chế tối đa việc lạm dụng `as`:** Chỉ sử dụng khi không còn giải pháp nào khác (như tích hợp thư viện JS bên ngoài hoặc xử lý kết quả của `JSON.parse`).
2.  **Tuyệt đối không dùng `as` để che giấu lỗi biên dịch:** Thay vì ép kiểu cho qua lỗi, hãy sửa cấu trúc dữ liệu hoặc sử dụng Union Types.
3.  **Thay thế `!` bằng Optional Chaining (`?.`):** Thay vì dùng `user.profile!.name`, hãy ưu tiên dùng `user.profile?.name` kết hợp với giá trị mặc định (`??`) để ứng dụng không bao giờ bị crash.
4.  **Luôn ưu tiên Type Guards:** Sử dụng `typeof`, `instanceof` hoặc hàm Type Predicates để thu hẹp kiểu dữ liệu một cách an toàn ở Runtime.
5.  **Dùng `unknown` thay cho `any` trước khi Assertion:** Khi viết các hàm trung gian nhận dữ liệu chưa rõ kiểu, hãy khai báo kiểu `unknown` để bắt buộc lập trình viên phải thực hiện Assertion hoặc Type Guard trước khi sử dụng.
