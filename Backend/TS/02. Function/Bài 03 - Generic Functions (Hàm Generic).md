## 1. Tại sao cần Generic Functions?
Hãy tưởng tượng bạn cần viết một hàm nhận vào một phần tử và trả về chính phần tử đó.

Nếu viết không dùng Generic:
```typescript
function identity(arg: number): number { return arg; }
```
Hàm này chỉ hoạt động với kiểu `number`. Nếu muốn dùng cho `string`, bạn phải viết thêm một hàm mới hoặc dùng `any`:
```typescript
function identity(arg: any): any { return arg; }
```
> [!CAUTION]
> Dùng `any` sẽ làm mất hoàn toàn thông tin kiểu dữ liệu. Nếu truyền vào một `string`, TypeScript sẽ không biết giá trị trả về là `string` nữa, dẫn đến mất an toàn kiểu ở các bước tiếp theo.

**Generic Functions (Hàm tổng quát)** giải quyết vấn đề này bằng cách tạo ra một **tham số kiểu (type parameter)** đóng vai trò như một biến chứa kiểu dữ liệu thực tế sẽ được truyền vào khi gọi hàm.

---

## 2. Cú pháp cơ bản
Chúng ta đặt tham số kiểu bên trong cặp ngoặc nhọn `<>` ngay trước phần ngoặc đơn khai báo tham số của hàm. Quy ước phổ biến nhất là dùng chữ cái `T` (đại diện cho Type).

```typescript
function identity<T>(arg: T): T {
  return arg;
}
```

### Cách sử dụng:

**Cách 1: Truyền kiểu dữ liệu tường minh**
```typescript
let output = identity<string>("myString"); // T được gán là string, output có kiểu string
```

**Cách 2: Để TypeScript tự suy luận (Khuyên dùng)**
TypeScript có thể tự động suy luận ra kiểu `T` dựa vào đối số truyền vào:
```typescript
let output = identity(123); // TypeScript tự đoán T là number, output có kiểu number
```

---

## 3. Các khía cạnh nâng cao của Generic Functions

### a. Generic với nhiều tham số kiểu
Bạn có thể khai báo nhiều tham số kiểu bằng cách ngăn cách chúng bằng dấu phẩy:
```typescript
function mergeObjects<U, V>(obj1: U, obj2: V): U & V {
  return { ...obj1, ...obj2 };
}

const result = mergeObjects({ name: "Alice" }, { age: 25 }); // result có kiểu: { name: string } & { age: number }
```

---

### b. Giới hạn kiểu Generic (Generic Constraints)
Đôi khi bạn muốn viết một hàm Generic hoạt động với nhiều kiểu dữ liệu, nhưng các kiểu này bắt buộc phải thỏa mãn một số thuộc tính tối thiểu nào đó (ví dụ: phải có thuộc tính `.length`).

Chúng ta sử dụng từ khóa **`extends`** để đặt giới hạn (constraint) cho tham số kiểu:

```typescript
interface Lengthwise {
  length: number;
}

// T bắt buộc phải có thuộc tính length kiểu number
function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length); // Không bị lỗi đỏ vì T đã được cam kết có length
  return arg;
}

loggingIdentity("hello");         // ✅ Hợp lệ (chuỗi có length)
loggingIdentity([1, 2, 3]);       // ✅ Hợp lệ (mảng có length)
// loggingIdentity(10);           // ❌ Lỗi compile: Argument of type 'number' is not assignable to parameter of type 'Lengthwise'.
```

---

## 4. Các quy tắc vàng khi thiết kế Generic Functions (Best Practices)

Để viết các hàm Generic tốt và dễ bảo trì, hãy tuân theo 3 nguyên tắc cốt lõi sau của TypeScript Team:

1. **Đẩy tham số kiểu xuống thấp nhất có thể (Push Type Parameters Down):**
   Nếu có thể, hãy để TypeScript tự suy luận kiểu trả về thay vì ép kiểu thủ công.
   ```typescript
   // ❌ Hạn chế (Ép kiểu trả về thủ công)
   function firstElement1<T>(arr: T[]): T { return arr[0]; }
   
   // ✅ Tốt hơn
   function firstElement2<T>(arr: T[]) { return arr[0]; }
   ```

2. **Dùng ít tham số kiểu nhất có thể (Use Fewer Type Parameters):**
   Đừng tạo thêm các tham số kiểu dư thừa nếu chúng không phục vụ mục đích liên kết kiểu giữa các tham số hoặc giá trị trả về.

3. **Tham số kiểu nên xuất hiện ít nhất 2 lần (Type Parameters Should Appear Twice):**
   Nếu một tham số kiểu chỉ xuất hiện duy nhất 1 lần trong chữ ký hàm, nó không giúp liên kết bất kỳ kiểu dữ liệu nào cả. Hãy đổi nó thành kiểu thông thường.
   ```typescript
   // ❌ Tệ: T chỉ xuất hiện 1 lần làm kiểu của tham số
   function greet<T extends string>(s: T) { console.log("Hello " + s); }
   
   // ✅ Tốt: Viết trực tiếp không cần Generic
   function greet(s: string) { console.log("Hello " + s); }
   ```
