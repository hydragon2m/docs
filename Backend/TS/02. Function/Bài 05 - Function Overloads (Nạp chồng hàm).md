## 1. Function Overloads là gì?
Trong JavaScript, bạn có thể gọi một hàm với nhiều kiểu đối số khác nhau (ví dụ: một hàm định dạng ngày tháng có thể nhận vào một đối số kiểu `Date`, kiểu số `timestamp`, hoặc 3 số đại diện cho `năm, tháng, ngày`).

Trong TypeScript, để mô tả một hàm có khả năng nhận các bộ đối số khác nhau và trả về các kiểu kết quả khác nhau tương ứng, chúng ta sử dụng **Function Overloads (Nạp chồng hàm)**.

---

## 2. Cách triển khai Function Overloads

Quá trình viết nạp chồng hàm gồm 2 phần rõ rệt:
1. **Overload Signatures (Các chữ ký nạp chồng):** Định nghĩa các cách gọi hàm hợp lệ (không chứa thân hàm `{}`).
2. **Implementation Signature (Chữ ký triển khai):** Phần thân hàm thực tế chứa mã nguồn xử lý logic.

### Ví dụ thực tế:
Chúng ta muốn viết hàm `makeDate` có 2 cách gọi:
- Cách 1: Truyền 1 tham số duy nhất là `timestamp` (number).
- Cách 2: Truyền đầy đủ 3 tham số `year`, `month`, `day` (number).

```typescript
// --- 1. OVERLOAD SIGNATURES ---
function makeDate(timestamp: number): Date;
function makeDate(year: number, month: number, day: number): Date;

// --- 2. IMPLEMENTATION SIGNATURE (Chữ ký triển khai) ---
// Chữ ký triển khai phải bao quát tất cả các trường hợp của chữ ký nạp chồng
function makeDate(yearOrTimestamp: number, month?: number, day?: number): Date {
  if (month !== undefined && day !== undefined) {
    return new Date(yearOrTimestamp, month, day);
  } else {
    return new Date(yearOrTimestamp);
  }
}

// Gọi hàm:
const d1 = makeDate(1692259200000);       // ✅ Hợp lệ (1 tham số)
const d2 = makeDate(2026, 7, 17);         // ✅ Hợp lệ (3 tham số)
// const d3 = makeDate(2026, 7);          // ❌ Lỗi compile! Không khớp với bất kỳ chữ ký nạp chồng nào.
```

---

## 3. Các Quy tắc quan trọng và Cạm bẫy

> [!IMPORTANT]
> ### 1. Chữ ký triển khai KHÔNG THỂ gọi trực tiếp
> Bạn chỉ được phép gọi hàm dựa trên các **chữ ký nạp chồng (Overload Signatures)**. Chữ ký triển khai (thân hàm) hoàn toàn bị ẩn đi đối với bên ngoài và không thể gọi trực tiếp được.
>
> Như ví dụ trên, mặc dù thân hàm khai báo nhận 2 tham số `makeDate(yearOrTimestamp, month?)`, việc gọi `makeDate(2026, 7)` vẫn báo lỗi vì không có chữ ký nạp chồng nào chấp nhận đúng 2 tham số.

> [!CAUTION]
> ### 2. Độ tương thích của Chữ ký triển khai
> Kiểu dữ liệu của các tham số và giá trị trả về trong chữ ký triển khai **bắt buộc phải bao quát (compatible)** toàn bộ các trường hợp của chữ ký nạp chồng. Nếu không thỏa mãn, TypeScript sẽ báo lỗi đỏ ở dòng khai báo thân hàm.
>
> ```typescript
> // Overload signatures
> function len(s: string): number;
> function len(arr: any[]): number;
> 
> // ❌ Lỗi compile: Chữ ký triển khai dưới đây dùng kiểu 'x: any' là không tương thích
> function len(x: boolean) { return 0; } 
> ```

---

## 4. Best Practice: Ưu tiên dùng Union Type thay vì Overloads

Khi thiết kế hàm, hãy luôn cân nhắc xem có thể dùng kiểu kết hợp (**Union Types**) thay vì nạp chồng hàm được không. Việc lạm dụng nạp chồng hàm sẽ làm code trở nên phức tạp và khó đọc hơn rất nhiều.

```typescript
// ❌ HẠN CHẾ: Viết nạp chồng phức tạp vô ích
function greet(name: string): void;
function greet(names: string[]): void;
function greet(nameOrNames: string | string[]) { ... }

// ✅ TỐT HƠN: Chỉ dùng 1 chữ ký duy nhất kết hợp với Union Type
function greet(name: string | string[]): void {
  if (typeof name === "string") {
    console.log(`Hello ${name}`);
  } else {
    name.forEach(n => console.log(`Hello ${n}`));
  }
}
```
*Lời khuyên: Chỉ sử dụng Function Overloads khi kiểu dữ liệu trả về phụ thuộc chặt chẽ vào kiểu dữ liệu truyền vào của tham số.*
