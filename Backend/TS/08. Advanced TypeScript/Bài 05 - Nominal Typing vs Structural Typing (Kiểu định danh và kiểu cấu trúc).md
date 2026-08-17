## 1. Phân biệt: Structural Typing vs Nominal Typing

Hệ thống kiểu dữ liệu được chia làm 2 trường phái chính:

### a. Structural Typing (Hệ thống kiểu theo Cấu Trúc)
* **Nguyên lý:** *"Nếu nó đi như một con vịt, kêu như một con vịt, thì nó là một con vịt"* (Duck Typing). Sự tương thích kiểu được quyết định bởi **hình dáng cấu trúc dữ liệu** (đối tượng có những trường nào, kiểu gì).
* **Đại diện:** **TypeScript**, Go, Python.
* **Hệ quả:** Hai đối tượng có tên kiểu hoàn toàn khác nhau nhưng nếu cấu trúc thuộc tính giống nhau thì vẫn có thể gán cho nhau thoải mái.

### b. Nominal Typing (Hệ thống kiểu theo Danh Tính)
* **Nguyên lý:** Sự tương thích kiểu được quyết định bởi **tên khai báo tường minh** của kiểu dữ liệu hoặc lớp.
* **Đại diện:** Java, C#, Rust, C++.
* **Hệ quả:** Dù hai đối tượng có cấu trúc thuộc tính giống hệt nhau, nếu chúng không được kế thừa hoặc khai báo cùng một lớp cha, bạn hoàn toàn **không thể** gán chúng cho nhau.

---

## 2. Vấn đề của Structural Typing trong ứng dụng thực tế
Do TypeScript tuân theo Structural Typing, đôi khi bạn gặp phải các lỗi logic nghiêm trọng mà trình biên dịch không thể phát hiện:

```typescript
type USDDollars = number;
type Euros = number;

let accountBalance: USDDollars = 100;
let productPrice: Euros = 80;

// ❌ Lỗi Logic nghiêm trọng: Cộng hai loại tiền tệ khác nhau!
// Nhưng TypeScript VẪN CHO PHÉP compile bình thường vì cả hai thực chất đều là kiểu 'number'.
accountBalance = accountBalance + productPrice; 
```

---

## 3. Kỹ thuật giả lập Nominal Typing: Branded Types (Kiểu dữ liệu có nhãn hiệu)

Để ép TypeScript phải kiểm soát kiểu nghiêm ngặt theo danh tính (Nominal Typing) cho các kiểu dữ liệu quan trọng, cộng đồng TypeScript nâng cao phát minh ra kỹ thuật **Branded Types (hoặc Tagged Types)**.

### Cách thực hiện:
Chúng ta "đóng dấu" (brand) lên kiểu dữ liệu gốc bằng cách giao nhau (`&`) với một cấu trúc đối tượng chứa một key nhãn hiệu độc nhất (thường sử dụng `unique symbol` để cấm trùng lặp).

```typescript
// Bước 1: Khai báo các brand độc nhất
declare const usdBrand: unique symbol;
declare const eurBrand: unique symbol;

// Bước 2: Tạo Branded Types
type USD = number & { readonly [usdBrand]: true };
type EUR = number & { readonly [eurBrand]: true };

// Bước 3: Tạo hàm chuyển đổi/khởi tạo (sử dụng Type Assertion)
function makeUSD(value: number): USD {
  return value as USD;
}
function makeEUR(value: number): EUR {
  return value as EUR;
}
```

### Kết quả kiểm tra kiểu:
```typescript
let wallet = makeUSD(100);
let price = makeEUR(80);

// wallet = price; 
// ❌ Lỗi compile ngay lập tức!
// Type 'EUR' is not assignable to type 'USD'. Types of property '[usdBrand]' are incompatible.

// Bạn chỉ được phép cộng hai giá trị có cùng nhãn USD:
let newWallet = makeUSD(wallet + 20); // ✅ Hợp lệ
```
*Ứng dụng thực tế:* Branded Types được dùng rất nhiều trong các hệ thống Tài chính - Ngân hàng, các hệ thống xử lý ID bảo mật cao (như phân biệt giữa `UserId` và `OrderId` đều là string nhưng không được phép truyền nhầm lẫn vào nhau trong các phương thức DB).
