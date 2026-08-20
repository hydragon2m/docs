## I. KHÁI QUÁT (OVERVIEW)

Trong lập trình chức năng (Functional Programming) và môi trường xử lý bất đồng bộ của Node.js, hàm là thực thể hạng nhất (First-class citizens). Điều này có nghĩa là hàm có thể được gán cho biến, được truyền vào như một đối số cho hàm khác, hoặc được trả về từ một hàm khác.

Hai mô thức thiết kế hàm cốt lõi xuất hiện ở khắp mọi nơi trong ứng dụng Node.js Backend là:
1.  **Callback Functions (Hàm gọi ngược):** Hàm được truyền làm đối số để thực thi sau khi một tác vụ bất đồng bộ hoàn thành.
2.  **Higher-Order Functions (HOF - Hàm bậc cao):** Hàm nhận một hoặc nhiều hàm khác làm đối số, hoặc trả về một hàm khác làm kết quả (ví dụ điển hình: Middleware trong Express/NestJS, Curried functions).

TypeScript cung cấp các giải pháp kiểm soát kiểu cực kỳ mạnh mẽ để đảm bảo việc truyền nhận các hàm này được an toàn, ngăn ngừa việc gọi sai tham số hoặc xử lý sai kiểu dữ liệu trả về.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Định kiểu cho Callback Functions
Callback truyền thống trong Node.js tuân thủ quy tắc **Error-First Callback Pattern**: Tham số đầu tiên luôn là đối tượng lỗi `Error` (hoặc `null` nếu thành công), và tham số thứ hai là dữ liệu kết quả.

#### Định nghĩa kiểu dữ liệu tường minh cho Callback:
```typescript
// Định nghĩa kiểu cho hàm Callback sử dụng Type Alias
type NodeCallback<T> = (err: Error | null, data?: T) => void;

// Hàm bất đồng bộ nhận Callback làm đối số
function fetchUserData(userId: string, callback: NodeCallback<{ name: string }>): void {
  if (!userId) {
    callback(new Error("Invalid User ID"));
    return;
  }
  // Xử lý thành công
  callback(null, { name: "Alice" });
}
```

---

### 2. Định kiểu cho Higher-Order Functions (HOF)
Một hàm được coi là Higher-Order Function nếu nó thỏa mãn ít nhất một trong hai điều kiện:
*   Nhận hàm khác làm đối số (ví dụ: các hàm mảng `map`, `filter`).
*   Trả về một hàm khác.

#### A. Hàm nhận hàm làm đối số (Function as Parameter)
Dưới đây là một hàm tính toán thời gian thực thi (Profiler) nhận một hàm tác vụ bất kỳ làm tham số:

```typescript
type TaskFunction<T> = () => T;

function profileTask<T>(taskName: string, task: TaskFunction<T>): T {
  const start = Date.now();
  const result = task(); // Thực thi hàm truyền vào
  const duration = Date.now() - start;
  console.log(`Task [${taskName}] took ${duration}ms`);
  return result;
}

const sum = profileTask("Sum 1M", () => {
  let s = 0;
  for (let i = 0; i < 1_000_000; i++) s += i;
  return s;
});
```

#### B. Hàm trả về một hàm khác (Function as Return Value)
Mô thức này cực kỳ phổ biến khi viết các **Factory Functions** để sinh ra các Middleware tùy biến cấu hình trong Node.js Backend.

```typescript
// Định nghĩa kiểu cho một Express-like Middleware
type Request = { headers: Record<string, string> };
type Response = { status: (code: number) => void; send: (msg: string) => void };
type NextFunction = () => void;
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

// Higher-Order Function tạo Middleware kiểm tra quyền truy cập (Role-based Authorization)
function authorize(allowedRoles: string[]): Middleware {
  // Trả về một hàm Middleware thực tế
  return (req, res, next) => {
    const userRole = req.headers["x-user-role"];
    if (!allowedRoles.includes(userRole)) {
      res.status(403);
      res.send("Forbidden");
      return;
    }
    next(); // Hợp lệ, chuyển tiếp sang handler tiếp theo
  };
}

// Cách sử dụng Factory Middleware:
const adminOnlyMiddleware = authorize(["admin"]);
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Kỹ thuật Curry Functions (Hàm hóa thắt nút) trong TypeScript
Currying là kỹ thuật chuyển đổi một hàm nhận nhiều đối số thành một chuỗi các hàm, mỗi hàm chỉ nhận một đối số duy nhất. Rất hữu ích cho việc thiết lập cấu hình trước (Partial Application).

```typescript
// Hàm logger thông thường nhận 3 tham số
// const log = (env: string, service: string, msg: string) => void;

// Curry Function được định kiểu an toàn
const curriedLogger = 
  (env: string) => 
  (service: string) => 
  (message: string): void => {
    console.log(`[${env.toUpperCase()}][${service}] ${message}`);
  };

// Tạo logger chuyên dụng cho môi trường production
const prodLogger = curriedLogger("production");

// Tạo logger chuyên dụng cho Auth Service trên production
const authProdLogger = prodLogger("AuthService");

// Thực thi ghi log thực tế (chỉ cần truyền tham số cuối cùng)
authProdLogger("User login successful"); 
// Output: [PRODUCTION][AuthService] User login successful
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & CORE RULES)

### 1. Cạm bẫy lỗi kiểu `this` khi truyền Callback Method
Khi truyền một phương thức của Class làm Callback cho một hàm khác, liên kết ngữ cảnh `this` mặc định của đối tượng sẽ bị mất nếu không cẩn thận.

```typescript
class DatabaseConnector {
  private connectionString = "mongodb://localhost:27017";

  connect(callback: (msg: string) => void) {
    callback("Connected successfully");
  }

  logConnectionString() {
    console.log(this.connectionString);
  }
}

const db = new DatabaseConnector();

// ❌ Cạm bẫy: Mất ngữ cảnh 'this'
// db.connect(db.logConnectionString); // Crash ở runtime vì 'this' lúc này là undefined

// ✅ Giải pháp 1: Sử dụng Arrow Function
db.connect(() => db.logConnectionString());

// ✅ Giải pháp 2: Sử dụng bind() để ép ngữ cảnh 'this' cố định
db.connect(db.logConnectionString.bind(db));
```

### 2. Sự khác biệt giữa Callback vs Promise
*   **Callback:** Truyền hàm vào bên trong để gọi ngược lại. Dễ dẫn đến hiện tượng **Callback Hell** (mã nguồn lồng nhau quá sâu) và nuốt lỗi nếu không kiểm tra `if (err)` nghiêm ngặt.
*   **Promise:** Trả về một đối tượng đại diện cho kết quả tương lai, hỗ trợ xử lý bằng `.then().catch()` hoặc `async/await` đồng bộ hóa code trực quan hơn.

---

## 💡 5 QUY TẮC VÀNG KHI SỬ DỤNG CALLBACK & HOF
1.  **Luôn định nghĩa kiểu cho Callbacks:** Tuyệt đối không để tham số của Callback tự động suy luận thành `any`. Hãy định nghĩa kiểu rõ ràng bằng Type Alias hoặc Interface.
2.  **Sử dụng Generic cho các hàm HOF linh hoạt:** Khi viết các hàm bao ngoài (Wrapper/Profiler/Decorator), hãy tận dụng Generic `<T>` để bảo toàn kiểu dữ liệu đầu ra khớp với kiểu dữ liệu của hàm gốc.
3.  **Thiết lập Middleware Factory bằng HOF:** Tận dụng HOF để đóng gói các cấu hình khởi tạo của Middleware trước khi đưa vào pipeline xử lý Request.
4.  **Bảo vệ liên kết `this`:** Luôn ghi nhớ cạm bẫy mất ngữ cảnh `this` khi truyền phương thức của Class làm Callback; hãy sử dụng arrow function hoặc `.bind(this)`.
5.  **Chuyển đổi Callback sang Promise (Promisify):** Đối với các API cũ của Node.js sử dụng callback, hãy dùng `util.promisify` để chuyển đổi sang Promise giúp code sạch hơn và tận dụng được cú pháp `async/await`.
