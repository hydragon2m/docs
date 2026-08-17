## I. KHÁI QUÁT (OVERVIEW)

### 1. Vấn đề liên kết chặt chẽ (Tight Coupling)
Trong lập trình hướng đối tượng (OOP), khi một Class tự chịu trách nhiệm khởi tạo các Class phụ thuộc của nó (Dependencies) bằng từ khóa `new`, chúng ta tạo ra sự liên kết chặt chẽ (Tight Coupling).

```typescript
class DatabaseService {
  query(sql: string) { /* ... */ }
}

class UserService {
  private db: DatabaseService;

  constructor() {
    // ❌ Tự khởi tạo đối tượng phụ thuộc bên trong constructor
    this.db = new DatabaseService(); 
  }
}
```
*Hệ quả:*
* Nếu Class `DatabaseService` thay đổi tham số khởi tạo, bạn phải sửa lại tất cả các class khác có sử dụng nó.
* Bạn hoàn toàn **không thể viết Unit Test** độc lập cho `UserService` vì nó luôn kéo theo việc kết nối DB thật.

---

### 2. Nguyên lý đảo ngược phụ thuộc (DIP - Dependency Inversion Principle)
Đây là chữ **D** trong nguyên lý **SOLID** nổi tiếng:
1. Các mô-đun cấp cao không nên phụ thuộc vào các mô-đun cấp thấp. Cả hai nên phụ thuộc vào sự trừu tượng (Abstraction - ví dụ như Interface).
2. Sự trừu tượng không nên phụ thuộc vào chi tiết. Chi tiết nên phụ thuộc vào sự trừu tượng.

**Inversion of Control (IoC - Đảo ngược quyền điều khiển)** là triết lý thiết kế chuyển giao quyền kiểm soát luồng chương trình và khởi tạo đối tượng từ lập trình viên sang cho một Framework tự động quản lý.

**Dependency Injection (DI - Tiêm phụ thuộc)** là kỹ thuật hiện thực hóa triết lý IoC. Thay vì tự tạo dependencies, Class sẽ yêu cầu các dependencies đó từ bên ngoài truyền vào.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Các phương thức triển khai Dependency Injection

Có 3 cách chính để thực hiện DI:

#### a. Constructor Injection (Tiêm qua hàm tạo - Khuyên dùng)
Dependencies được truyền trực tiếp vào Class khi khởi tạo thông qua constructor. Đây là cách làm an toàn và phổ biến nhất vì nó đảm bảo đối tượng luôn có đầy đủ các dependency cần thiết ngay khi sinh ra.

```typescript
class UserService {
  // Nhận instance từ bên ngoài truyền vào
  constructor(private db: DatabaseService) {} 
}
```

#### b. Setter/Property Injection (Tiêm qua phương thức/thuộc tính)
Dependencies được gán thông qua các phương thức setter hoặc trực tiếp vào thuộc tính của class sau khi class đã được khởi tạo. 
* *Hạn chế:* Đối tượng có thể ở trạng thái không hoàn chỉnh nếu lập trình viên quên gọi hàm setter.

---

### 2. Lợi ích tối thượng của DI đối với Kiểm thử (Testing)
Nhờ có DI, việc viết Unit Test trở nên dễ dàng hơn bao giờ hết. Bạn chỉ cần tạo ra một đối tượng giả lập (Mock Database) và tiêm nó vào UserService thay thế cho Database thật:

```typescript
// Tạo Mock Database giả lập không kết nối mạng thật
const mockDatabase = {
  query: (sql: string) => [{ id: 1, name: "Mock User" }]
};

// Tiêm Mock vào UserService để test độc lập
const testUserService = new UserService(mockDatabase as any);
```

---

### 3. Cách NestJS Dependency Injection Container hoạt động ngầm

NestJS sở hữu một bộ quản lý tập trung gọi là **IoC Container** (hoặc DI Container). 
1. Khi ứng dụng khởi động, NestJS quét qua toàn bộ các Class được đánh dấu `@Injectable()` (gọi là **Providers**).
2. Container phân tích Constructor của từng Class để tìm kiếm các dependencies cần thiết.
3. Nó tự động khởi tạo các dependencies theo đúng thứ tự ưu tiên (Class con trước, Class cha sau).
4. Container lưu giữ các thực thể này (mặc định dưới dạng **Singleton** - duy nhất một thực thể trong RAM) và tự động tiêm chúng vào các controller/service cần dùng.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy cùng xem sự chuyển dịch mã nguồn từ liên kết chặt chẽ (Tight Coupling) sang sử dụng Dependency Injection thủ công trong Node.js:

### Mã nguồn tồi (Tight Coupling):
```javascript
class MySQLDatabase {
  connect() { return "Connected to MySQL"; }
}

class OrderService {
  constructor() {
    this.db = new MySQLDatabase(); // ❌ Bị khóa cứng vào MySQL
  }
}
```

### Mã nguồn tốt (Sử dụng Dependency Injection):
```javascript
// Bước 1: Định nghĩa Interface hoặc Class cơ sở chung (Abstraction)
class IDatabase {
  connect() { throw new Error("Not implemented"); }
}

class MongoDatabase extends IDatabase {
  connect() { return "Connected to MongoDB"; }
}

// Bước 2: Thiết kế Service nhận Database thông qua Constructor Injection
class OrderService {
  constructor(db) {
    this.db = db; // ✅ Nhận bất kỳ DB nào kế thừa IDatabase
  }
  
  process() {
    console.log(this.db.connect());
  }
}

// Bước 3: Tiêm phụ thuộc thủ công lúc khởi tạo (IoC thủ công)
const dbInstance = new MongoDatabase();
const orderService = new OrderService(dbInstance); // Tiêm vào
orderService.process(); // Output: "Connected to MongoDB"
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### Cạm bẫy phụ thuộc vòng quanh (Circular Dependency)
> Phụ thuộc vòng quanh xảy ra khi Class A cần Class B để khởi tạo, nhưng Class B cũng yêu cầu Class A trong constructor:
> `Class A -> Class B -> Class A`
> 
> Khi gặp trường hợp này, IoC Container sẽ bị kẹt vào vòng lặp vô hạn và crash ứng dụng lúc khởi động với lỗi: `Circular dependency detected`.
>
> **Quy tắc cốt lõi:**
> - Thiết kế lại cấu trúc thư mục, tách biệt phần logic chung ra một Class C thứ ba để cả A và B cùng gọi.
> - Trong NestJS, nếu bắt buộc phải dùng, hãy sử dụng kỹ thuật **`forwardRef()`** để trì hoãn việc giải quyết dependency của một trong hai bên.
