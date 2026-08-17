## 1. Sự kết hợp giữa Union và Intersection
Trong thiết kế phần mềm thực tế, bạn không chỉ dùng đơn lẻ `|` hoặc `&` mà thường phải kết hợp chúng lại để mô tả các cấu trúc dữ liệu phức tạp. 

Quy tắc phân phối toán học hoàn toàn áp dụng được cho kiểu dữ liệu trong TypeScript:
```typescript
(A | B) & C  // tương đương với: (A & C) | (B & C)
```

---

## 2. Ví dụ thực tế: Cấu hình hệ thống Logger và Network
Chúng ta có 2 phương thức vận chuyển log: `ConsoleLogger` và `FileLogger`. Và chúng ta muốn gộp chúng với cấu hình chung của hệ thống bảo mật (`SecureConfig`):

```typescript
interface ConsoleLogger {
  type: "console";
  colorMode: boolean;
}

interface FileLogger {
  type: "file";
  filePath: string;
}

interface SecureConfig {
  apiKey: string;
}

// Thiết kế kiểu: Hệ thống bắt buộc phải có SecureConfig, 
// và phải chọn một trong 2 phương thức Console hoặc File Logger.
type AppConfig = (ConsoleLogger | FileLogger) & SecureConfig;

const config1: AppConfig = {
  type: "console",
  colorMode: true,
  apiKey: "sec_key_102" // ✅ Hợp lệ (Có ConsoleLogger & SecureConfig)
};

const config2: AppConfig = {
  type: "file",
  filePath: "/var/log/app.log",
  apiKey: "sec_key_102" // ✅ Hợp lệ (Có FileLogger & SecureConfig)
};
```

---

## 3. Bản chất lý thuyết: Khái niệm "Tập Hợp" (Set Theory)

Để hiểu sâu về hành vi của Union và Intersection trên Object, hãy liên tưởng đến lý thuyết tập hợp (Set Theory):

### a. Union (`|`) - Phép Hợp (Set Union)
* **Ý nghĩa:** Chấp nhận một giá trị thuộc tập hợp A hoặc tập hợp B.
* **Với Object:** Việc kết hợp kiểu `A | B` làm **giảm đi sự chắc chắn** về các thuộc tính của đối tượng. Khi chưa check kiểu, bạn chỉ được truy cập các thuộc tính chung (phần giao nhau của các tập hợp thuộc tính).

### b. Intersection (`&`) - Phép Giao (Set Intersection)
* **Ý nghĩa:** Bắt buộc giá trị phải thỏa mãn cả tập hợp A và tập hợp B cùng một lúc.
* **Với Object:** Việc kết hợp kiểu `A & C` làm **tăng thêm số lượng thuộc tính bắt buộc** của đối tượng (hợp các thuộc tính của cả hai). Đối tượng mới sẽ lớn hơn và chứa đầy đủ dữ liệu của cả hai kiểu cũ.

---

## 4. Các Lưu ý quan trọng khi thiết kế

> [!WARNING]
> ### Thứ tự ưu tiên của toán tử (Operator Precedence)
> Toán tử giao nhau `&` có thứ tự ưu tiên cao hơn toán tử kết hợp `|`, tương tự như phép nhân `*` có độ ưu tiên cao hơn phép cộng `+` trong toán học.
>
> Nếu bạn viết:
> ```typescript
> type X = A | B & C;
> ```
> TypeScript sẽ tự hiểu là:
> ```typescript
> type X = A | (B & C);
> ```
> Hãy luôn sử dụng dấu ngoặc đơn `()` rõ ràng để định hình luồng gom nhóm kiểu dữ liệu mong muốn của bạn, tránh lỗi logic do compiler hiểu sai ý đồ.
