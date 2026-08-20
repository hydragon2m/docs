## I. KHÁI QUÁT (OVERVIEW)

Trong các dự án Backend TypeScript quy mô lớn, chúng ta luôn cố gắng tuân thủ nguyên lý **DRY (Don't Repeat Yourself - Không lặp lại chính mình)**. Khi viết code, chúng ta thường xuyên đối mặt với nhu cầu tái sử dụng kiểu dữ liệu:
*   Muốn lấy kiểu dữ liệu trả về của một hàm API hoặc một truy vấn ORM để gán cho một biến khác, mà không muốn định nghĩa lại Interface đó bằng tay.
*   Muốn lấy chính xác danh sách kiểu dữ liệu của các đối số đầu vào của một hàm từ bên thứ ba để xây dựng hàm bao bọc (Wrapper Function).

Để giải quyết nhu cầu trích xuất kiểu dữ liệu động này, TypeScript cung cấp các **Utility Types** chuyên dụng dành riêng cho Function bao gồm: **`Parameters<T>`**, **`ReturnType<T>`**, **`ConstructorParameters<T>`**, và **`InstanceType<T>`**. Chúng hoạt động dựa trên cơ chế suy luận kiểu động ở thời điểm biên dịch (Compile-time Type Inference).

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Hàm `Parameters<T>`
Trích xuất kiểu dữ liệu của toàn bộ tham số đầu vào của một kiểu hàm `T`. Kết quả trả về là một kiểu **Tuple (mảng cố định)** chứa các kiểu của tham số theo đúng thứ tự.

```typescript
function saveUser(userId: string, data: { email: string; active: boolean }): boolean {
  return true;
}

// Trích xuất kiểu tham số của hàm saveUser
type SaveUserParams = Parameters<typeof saveUser>; 
// Kết quả suy luận của TS: [userId: string, data: { email: string; active: boolean }]

// Lấy kiểu của tham số thứ 2 (chỉ mục index = 1)
type UserData = SaveUserParams[1]; 
// Kết quả: { email: string; active: boolean }
```

---

### 2. Hàm `ReturnType<T>`
Trích xuất kiểu dữ liệu trả về của một kiểu hàm `T`. Đây là một trong những Utility Types được sử dụng nhiều nhất trong thực tế.

```typescript
async function fetchConfig() {
  return {
    port: 3000,
    dbUrl: "mongodb://localhost",
    features: { signup: true, chat: false }
  };
}

// Trích xuất kiểu trả về của hàm fetchConfig
// Lưu ý: Vì fetchConfig là hàm async nên kiểu trả về thực tế là Promise<{...}>
type FetchConfigPromise = ReturnType<typeof fetchConfig>; 

// Lấy kiểu dữ liệu thực tế bên trong Promise bằng Awaited<T>
type AppConfig = Awaited<FetchConfigPromise>;
/* Kết quả tự động trích xuất:
  {
    port: number;
    dbUrl: string;
    features: { signup: boolean; chat: boolean; }
  }
*/
```

---

### 3. Hàm `ConstructorParameters<T>` & `InstanceType<T>`
Hai Utility Types này dành riêng cho các **Class** hoặc các hàm khởi tạo (Constructor Functions):
*   `ConstructorParameters<T>`: Trích xuất kiểu của các tham số truyền vào hàm constructor của Class `T` dưới dạng Tuple.
*   `InstanceType<T>`: Trích xuất kiểu thực thể (Instance) được tạo ra từ Class `T`.

```typescript
class DatabaseConnection {
  constructor(connectionString: string, options?: { timeout: number }) {}
}

// 1. Trích xuất kiểu tham số constructor
type ConnParams = ConstructorParameters<typeof DatabaseConnection>;
// Kết quả: [connectionString: string, options?: { timeout: number } | undefined]

// 2. Trích xuất kiểu thực thể của Class
type DbInstance = InstanceType<typeof DatabaseConnection>;
// Tương đương với việc khai báo kiểu: DatabaseConnection
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Tự động định kiểu cho Wrapper Function (Hàm bao bọc)
Kịch bản Backend: Bạn cần viết một hàm log ghi nhận log lại mọi thao tác gọi đến một dịch vụ Service có sẵn, bảo toàn nguyên vẹn kiểu dữ liệu của các tham số và kết quả trả về của hàm gốc mà không cần hardcode kiểu:

```typescript
// Giả sử đây là hàm xử lý thanh toán của thư viện bên thứ 3
function processPayment(cardToken: string, amount: number): { success: boolean; transactionId: string } {
  return { success: true, transactionId: "tx-abc-123" };
}

// Viết Wrapper Function tự động trích xuất kiểu động
function debugPaymentWrapper(
  ...args: Parameters<typeof processPayment>
): ReturnType<typeof processPayment> {
  console.log(`[PAYMENT_LOG] Đang xử lý thanh toán với tham số:`, args);
  
  // Thực thi hàm gốc
  const result = processPayment(...args);
  
  console.log(`[PAYMENT_LOG] Kết quả trả về:`, result);
  return result;
}

// Việc gọi hàm wrapper được bảo vệ kiểm tra kiểu đầu vào nghiêm ngặt
debugPaymentWrapper("token-111", 500); // ✅ Hợp lệ
// debugPaymentWrapper("token-111", "500"); // ❌ Lỗi biên dịch: Argument of type 'string' is not assignable to parameter of type 'number'
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & CORE RULES)

### 1. Cạm bẫy sử dụng `typeof` bắt buộc
Các Utility Types như `Parameters<T>` và `ReturnType<T>` yêu cầu tham số truyền vào phải là một **Kiểu dữ liệu (Type)** chứ không phải là một **Giá trị (Value)** thực tế. 
*   Do đó, bạn không thể truyền trực tiếp tên hàm (là một giá trị) vào.
*   Bắt buộc phải sử dụng toán tử **`typeof`** đứng trước tên hàm để chuyển đổi từ giá trị hàm sang kiểu dữ liệu của hàm đó.

```typescript
function greet() { return "hello"; }

// Lỗi biên dịch ❌
// type Result = ReturnType<greet>; // Error: 'greet' refers to a value, but is being used as a type here.

// Hợp lệ ✅
type ResultCorrect = ReturnType<typeof greet>;
```

### 2. Sự khác biệt giữa `ReturnType<T>` vs `Awaited<ReturnType<T>>`
Đối với các hàm xử lý bất đồng bộ (`async function`), giá trị trả về thực tế luôn được bọc trong một `Promise<T>`. 
*   Nếu chỉ dùng `ReturnType<typeof myAsyncFunc>`, kết quả nhận được sẽ là `Promise<T>`.
*   Để lấy được kiểu dữ liệu thực tế sau khi Promise được giải quyết (resolve), bắt buộc phải bọc ngoài bằng `Awaited<...>`: `Awaited<ReturnType<typeof myAsyncFunc>>`.

---

## 💡 5 QUY TẮC VÀNG KHI SỬ DỤNG UTILITY TYPES CHO FUNCTION
1.  **Luôn áp dụng DRY thông qua trích xuất kiểu:** Khi viết các hàm Wrapper, Middleware, Decorator, hoặc Interceptor, hãy dùng `Parameters<T>` và `ReturnType<T>` để tự động đồng bộ kiểu với hàm gốc.
2.  **Đọc kiểu dữ liệu API thông qua ReturnType:** Khi tích hợp với các API client (như Axios) hoặc ORM client (như Prisma, TypeORM), hãy trích xuất kiểu dữ liệu trả về của các truy vấn để định nghĩa kiểu cho Controller/Response DTO mà không cần khai báo lại thủ công.
3.  **Kết hợp với `typeof` đúng luật:** Luôn nhớ ghi từ khóa `typeof` trước tên biến hoặc tên hàm khi truyền vào làm đối số cho các Utility Types.
4.  **Bóc tách Promise bằng Awaited:** Luôn bọc `Awaited<...>` bên ngoài `ReturnType<...>` đối với toàn bộ các hàm xử lý bất đồng bộ (`async/await`).
5.  **Dùng InstanceType để định nghĩa Factory Class:** Khi viết các mẫu thiết kế Factory sinh ra các đối tượng Class động, sử dụng `InstanceType<typeof Class>` để TypeScript suy luận chính xác kiểu của thực thể trả về.
