## 1. Primitive Types là gì?
Trong JavaScript và TypeScript, **Primitive Types** (Kiểu dữ liệu nguyên thủy) là các kiểu dữ liệu cơ bản nhất, đại diện cho một giá trị đơn lẻ và không thể phân rã thành các đối tượng nhỏ hơn.

TypeScript hỗ trợ đầy đủ các kiểu nguyên thủy của JavaScript và giúp kiểm soát chúng chặt chẽ hơn.

---

## 2. Ba kiểu nguyên thủy phổ biến nhất

### a. `number`
Biểu diễn tất cả các loại số: số nguyên, số thập phân (số thực), số âm, và các giá trị số đặc biệt như `NaN` (Not a Number) hay `Infinity`.

```typescript
let score: number = 95;      // Số nguyên
let rate: number = 4.5;      // Số thập phân
let temperature: number = -10; // Số âm
```

### b. `string`
Biểu diễn chuỗi văn bản. Bạn có thể sử dụng nháy đơn `'`, nháy kép `"`, hoặc template string với dấu backtick `` ` `` để nối chuỗi và truyền biến.

```typescript
let brand: string = "Apple";
let model: string = 'MacBook';
let description: string = `Đây là chiếc ${brand} ${model} của tôi.`;
```

### c. `boolean`
Chỉ nhận một trong hai giá trị duy nhất: `true` (đúng) hoặc `false` (sai). Thường dùng cho các cờ trạng thái (flags) hoặc biểu thức logic điều kiện.

```typescript
let isLoggedIn: boolean = false;
let hasPermission: boolean = true;
```

---

## 3. Các kiểu nguyên thủy khác (Nâng cao hơn)

* **`bigint`**: Dành cho các số nguyên cực kỳ lớn (vượt quá giới hạn an toàn của `number` là \(2^{53} - 1\)). Cần target ES2020 trở lên.
  ```typescript
  let hugeNumber: bigint = 9007199254740991n; // Lưu ý chữ 'n' ở cuối
  ```
* **`symbol`**: Dùng để tạo ra các định danh duy nhất và không thể trùng lặp (thường dùng làm key ẩn cho Object).
  ```typescript
  let uniqueKey: symbol = Symbol("description");
  ```

---

## 4. Cảnh báo quan trọng: Chữ thường (`string`) vs Chữ hoa (`String`)

> [!CAUTION]
> Trong TypeScript, bạn **LUÔN LUÔN** phải dùng chữ viết thường cho các kiểu dữ liệu nguyên thủy: `string`, `number`, `boolean`.
> 
> Tránh tuyệt đối dùng các kiểu viết hoa: `String`, `Number`, `Boolean`.
> - `string` (viết thường): Là kiểu dữ liệu nguyên thủy trong TypeScript.
> - `String` (viết hoa): Là các Wrapper Object (đối tượng bọc bên ngoài) được tích hợp sẵn trong JavaScript.
>
> ### Ví dụ thực tế:
> ```typescript
> let s1: string = "hello";              // Kiểu nguyên thủy (Primitive Value)
> let s2: String = new String("hello");  // Đối tượng bọc (Wrapper Object)
> 
> console.log(typeof s1); // "string"
> console.log(typeof s2); // "object"
> 
> // TypeScript sẽ báo lỗi nếu bạn gán đối tượng String cho biến kiểu nguyên thủy string:
> let s3: string = new String("hello"); 
> // ❌ Lỗi: Type 'String' is not assignable to type 'string'.
> // 'string' is a primitive, but 'String' is a wrapper object. Prefer using 'string' when possible.
> ```
> Vì vậy, hãy luôn dùng `string`, `number`, `boolean` viết thường để đảm bảo an toàn kiểu dữ liệu và tránh những hành vi không mong muốn khi runtime.
