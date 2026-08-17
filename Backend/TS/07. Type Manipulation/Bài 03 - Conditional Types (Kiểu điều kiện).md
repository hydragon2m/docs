## 1. Conditional Types là gì?
Trong JavaScript, bạn sử dụng toán tử ba ngôi `condition ? trueExpression : falseExpression` để rẽ nhánh giá trị logic khi chạy chương trình.

Trong TypeScript, **Conditional Types (Kiểu điều kiện)** cung cấp cú pháp tương tự nhưng chạy **ngay trong lúc compile** để quyết định kiểu dữ liệu đầu ra dựa trên mối quan hệ giữa các kiểu đầu vào:

### Cú pháp:
```typescript
SomeType extends OtherType ? TrueType : FalseType
```
*Ý nghĩa:* Nếu kiểu `SomeType` có thể gán được (assignable) cho kiểu `OtherType`, kết quả trả về sẽ là kiểu `TrueType`, ngược lại trả về kiểu `FalseType`.

---

## 2. Ví dụ cơ bản và Nâng cao

### Ví dụ cơ bản: Kiểm tra xem T có phải là string
```typescript
type IsString<T> = T extends string ? "Đúng là string" : "Không phải string";

type Test1 = IsString<string>; // Kiểu: "Đúng là string"
type Test2 = IsString<number>; // Kiểu: "Không phải string"
```

### Ví dụ ứng dụng thực tế: Thiết kế API trả về an toàn kiểu
Nếu truyền vào ID kiểu `number`, kết quả trả về là một `UserEntity`. Nếu truyền vào ID kiểu `string`, trả về `UserEntity[]`:

```typescript
interface UserEntity { id: number; name: string }

type FetchUserResult<T extends number | string> = T extends number ? UserEntity : UserEntity[];

function fetchUser<T extends number | string>(id: T): FetchUserResult<T> {
  // Logic query db...
  throw "Not implemented";
}

const u1 = fetchUser(10);     // u1 tự động có kiểu: UserEntity
const u2 = fetchUser("admin"); // u2 tự động có kiểu: UserEntity[]
```

---

## 3. Kiến thức chuyên sâu nâng cao

### a. Cơ chế phân phối (Distributive Conditional Types)
Khi kiểu điều kiện hoạt động trên một **Tham số kiểu Generic** chứa một **Union Type**, TypeScript sẽ tự động phân phối điều kiện đó qua từng thành phần của Union.

```typescript
type ToArray<Type> = Type extends any ? Type[] : never;

// Nếu truyền Union: string | number
type StrOrNumArray = ToArray<string | number>;
// TypeScript tự động phân phối thành: ToArray<string> | ToArray<number>
// Kết quả cuối cùng: string[] | number[]
```
*Lưu ý:* Cơ chế phân phối này chính là cách hoạt động cốt lõi của các Utility Types như `Exclude` và `Extract` đã học ở chương trước.

---

### b. Từ khóa `infer` (Suy luận kiểu dữ liệu động)
Từ khóa **`infer`** được đặt trong mệnh đề `extends` của kiểu điều kiện để khai báo một **biến kiểu dữ liệu tự động dò tìm**. TypeScript sẽ tự động phân tích và suy luận ra kiểu dữ liệu thực tế tại vị trí đó.

#### Ví dụ: Tự viết kiểu `GetArrayElement` lấy ra kiểu phần tử của mảng
```typescript
type GetArrayElement<T> = T extends (infer Element)[] ? Element : T;

type Test1 = GetArrayElement<string[]>; // Element được suy luận là string. Kết quả: string.
type Test2 = GetArrayElement<number>;   // Không khớp dạng mảng. Kết quả: number.
```

#### Ví dụ: Tự viết `UnwrapPromise` lấy kiểu của giá trị sau await Promise
```typescript
type UnwrapPromise<T> = T extends Promise<infer Value> ? UnwrapPromise<Value> : T; 
// Đệ quy mở nhiều tầng Promise lồng nhau

type FinalType = UnwrapPromise<Promise<Promise<string>>>; // Kết quả: string
```
 Cú pháp `infer` kết hợp với đệ quy chính là đỉnh cao của thiết kế hệ thống kiểu dữ liệu trong TypeScript, giúp bạn viết các thư viện xử lý bất đồng bộ hoặc kết nối ORM vô cùng chuyên nghiệp.
