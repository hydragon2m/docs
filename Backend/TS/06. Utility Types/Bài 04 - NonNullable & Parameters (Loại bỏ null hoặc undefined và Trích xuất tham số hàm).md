## 1. `NonNullable<T>` (Loại bỏ giá trị rỗng)
`NonNullable<T>` là Utility Type giúp loại bỏ hoàn toàn các kiểu `null` và `undefined` ra khỏi một kiểu dữ liệu `T`.

### Định nghĩa dưới lớp vỏ:
```typescript
type MyNonNullable<T> = T extends null | undefined ? never : T;
```

### Ví dụ thực tế:
```typescript
type MaybeUser = string | null | undefined;

// Loại bỏ null và undefined để lấy kiểu chắc chắn có giá trị
type DefiniteUser = NonNullable<MaybeUser>; 
// Kiểu DefiniteUser tương đương với: string
```

---

## 2. `Parameters<T>` (Trích xuất tham số của Hàm thành Tuple)
Khi làm việc với các thư viện bên thứ ba, bạn thường muốn viết một hàm bọc (wrapper function) nhận vào các đối số giống hệt như một hàm có sẵn trong thư viện, nhưng thư viện đó lại không export kiểu dữ liệu của các tham số đó ra ngoài.

**`Parameters<T>`** giải quyết vấn đề này bằng cách trích xuất toàn bộ kiểu dữ liệu các tham số của một hàm `T` và trả về dưới dạng một **Tuple Type**.

### Định nghĩa dưới lớp vỏ (Sử dụng từ khóa `infer` - sẽ học kỹ ở chương sau):
```typescript
type MyParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
```
*Ý nghĩa:* Tự động dò và suy luận (`infer`) ra mảng các tham số `P` của hàm `T`.

### Ví dụ ứng dụng thực tế:
```typescript
// Hàm xử lý thanh toán có sẵn trong thư viện (không export kiểu tham số)
function processPayment(cardId: number, amount: number, currency: "USD" | "VND") {
  console.log(`Paying ${amount} ${currency}`);
}

// Trích xuất kiểu tham số của hàm processPayment thành Tuple:
// Kiểu PaymentParams tương đương với: [cardId: number, amount: number, currency: "USD" | "VND"]
type PaymentParams = Parameters<typeof processPayment>;

// Sử dụng Tuple trích xuất được để định nghĩa tham số cho hàm bọc của bạn
function mySecurePaymentWrapper(...args: PaymentParams) {
  console.log("Ghi nhận log bảo mật trước khi thanh toán...");
  processPayment(...args); // Truyền an toàn 100% kiểu dữ liệu
}

mySecurePaymentWrapper(12345, 100, "USD"); // ✅ Hợp lệ
```
*Mẹo: Toán tử `typeof` được sử dụng trước `processPayment` vì `Parameters` yêu cầu đầu vào là một **Kiểu dữ liệu (Type)** chứ không phải một giá trị/hàm thực tế chạy ở runtime.*
