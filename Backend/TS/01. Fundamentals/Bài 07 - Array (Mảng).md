## 1. Mảng (Array) trong TypeScript là gì?
Trong JavaScript, mảng là một danh sách động có thể chứa bất kỳ kiểu dữ liệu nào cùng một lúc (số, chuỗi, object...). Sự tự do này rất dễ sinh ra lỗi logic khi thao tác với phần tử trong mảng.

TypeScript giúp bạn kiểm soát mảng chặt chẽ bằng cách quy định **mảng chỉ được chứa các phần tử thuộc một kiểu dữ liệu cố định** (hoặc một nhóm kiểu dữ liệu xác định trước).

---

## 2. Hai cú pháp khai báo mảng phổ biến

TypeScript hỗ trợ hai cách để chú thích kiểu cho mảng. Về mặt tính năng, hai cách này hoàn toàn tương đương nhau.

### Cách 1: Sử dụng cặp ngoặc vuông `type[]` (Khuyên dùng)
Đây là cú pháp phổ biến, ngắn gọn và dễ đọc nhất.

```typescript
let listNumbers: number[] = [1, 2, 3, 4, 5];
let listStrings: string[] = ["Apple", "Banana", "Cherry"];
```

### Cách 2: Sử dụng cú pháp Generic `Array<type>`
Cú pháp này sử dụng tính năng Generic (chúng ta sẽ học sâu ở chương sau).

```typescript
let listNumbers: Array<number> = [1, 2, 3, 4, 5];
let listStrings: Array<string> = ["Apple", "Banana", "Cherry"];
```

---

## 3. Các dạng mảng đặc biệt nâng cao

### a. Mảng chứa nhiều kiểu dữ liệu (Array of Unions)
Để định nghĩa một mảng có thể chứa đồng thời cả số và chuỗi, ta sử dụng dấu ngoặc đơn kết hợp toán tử hoặc `|`:

```typescript
// Mảng chứa cả number và string
let mixedArray: (number | string)[] = [1, "two", 3, "four"];
```

> [!WARNING]
> Phải bao bọc kiểu kết hợp trong dấu ngoặc đơn `(number | string)[]`. 
> Nếu viết là `number | string[]`, TypeScript sẽ hiểu biến đó có kiểu là "hoặc một số đơn lẻ" hoặc "một mảng chỉ chứa chuỗi".

---

### b. Mảng chứa các đối tượng (Array of Objects)
Kết hợp bài học trước, bạn có thể tạo mảng chứa các đối tượng có cấu trúc định sẵn bằng cách kết hợp với Type Alias hoặc Interface:

```typescript
type User = {
  id: number;
  name: string;
};

// Mảng chứa các đối tượng có cấu trúc của User
let users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];
```

---

### c. Mảng nhiều chiều (Multi-dimensional Arrays)
Khai báo mảng chứa mảng khác bằng cách viết thêm các cặp ngoặc vuông `[]`:

```typescript
// Mảng hai chiều (Ma trận số)
let matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6]
];
```

---

### d. Mảng chỉ đọc (Readonly Array)
Trong nhiều trường hợp, bạn muốn đảm bảo mảng sau khi tạo ra sẽ **không bị sửa đổi** (không thể push, pop, shift, splice hoặc gán lại phần tử). TypeScript cung cấp từ khóa `readonly` để bảo vệ dữ liệu:

```typescript
// Cách 1: Sử dụng từ khóa readonly ở trước
let readableList: readonly number[] = [1, 2, 3];

// Cách 2: Sử dụng kiểu ReadonlyArray<type>
let readableList2: ReadonlyArray<string> = ["A", "B", "C"];

// Tất cả các phương thức làm thay đổi mảng đều bị báo lỗi:
readableList.push(4);      // ❌ Lỗi: Property 'push' does not exist on type 'readonly number[]'.
readableList[0] = 10;      // ❌ Lỗi: Index signature in type 'readonly number[]' only permits reading.
```

---

## 4. Các Lưu ý quan trọng và lỗi thường gặp

> [!IMPORTANT]
> ### 1. Kiểu dữ liệu mặc định của mảng trống `[]`
> Nếu bạn khai báo một mảng rỗng mà không gán kiểu dữ liệu:
> ```typescript
> let items = []; // TypeScript suy luận kiểu là 'any[]'
> ```
> Mảng `any[]` sẽ mất khả năng kiểm soát kiểu dữ liệu. Hãy luôn định nghĩa kiểu rõ ràng cho các mảng rỗng khi khởi tạo.
>
> ### 2. Vấn đề truy xuất ngoài phạm vi (Out-of-bounds access)
> TypeScript mặc định **không báo lỗi compile** khi bạn truy cập một phần tử nằm ngoài độ dài của mảng. Điều này rất dễ gây lỗi `undefined` ở runtime.
> ```typescript
> let names: string[] = ["Alice", "Bob"];
> let secret = names[10]; // TypeScript vẫn hiểu 'secret' là 'string' khi compile!
> // Nhưng ở runtime: 'secret' thực chất có giá trị là 'undefined'.
> ```
> *Lưu ý: Để khắc phục điều này, bạn có thể bật cấu hình `"noUncheckedIndexedAccess": true` trong file `tsconfig.json`.*
