## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần Repository Pattern?
Khi viết code Backend, nếu bạn viết trực tiếp các câu truy vấn cơ sở dữ liệu (ví dụ: `db.query("SELECT * FROM users...")` hoặc dùng ORM trực tiếp `UserEntity.find(...)`) ngay bên trong tầng xử lý logic nghiệp vụ (Service Layer), bạn đang vi phạm nguyên lý Single Responsibility (Đơn nhiệm) của SOLID.

Nếu sau này bạn có nhu cầu:
* Thay đổi công nghệ cơ sở dữ liệu (ví dụ chuyển từ MySQL sang MongoDB).
* Thay đổi thư viện ORM (chuyển từ TypeORM sang Prisma).
* Viết Unit Test cho Service mà không muốn gọi DB thật.
*Bạn sẽ phải sửa đổi lại gần như toàn bộ code logic của Service.*

**Repository Pattern** là mẫu thiết kế đóng vai trò làm **lớp trung gian** nằm giữa Tầng Nghiệp vụ (Service) và Tầng Truy xuất Dữ liệu (Database), giúp che giấu chi tiết kỹ thuật của việc lưu trữ dữ liệu dưới một giao diện trừu tượng (Interface).

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Phân biệt: Active Record vs Data Mapper (Mẫu ORM)

Trong thế giới ORM (như TypeORM), có hai trường phái thiết kế truy xuất dữ liệu chính:

```text
  [ACTIVE RECORD PATTERN]                      [DATA MAPPER PATTERN]
  
  ┌───────────────────────────┐                ┌───────────────────────────┐
  │        User Entity        │                │        User Entity        │ (Chỉ chứa thuộc tính
  │ - Thuộc tính (id, name...)│                │ - Thuộc tính (id, name...)│  & logic đối tượng)
  │ - Hàm DB (save, find...)  │                └───────────────────────────┘
  └───────────────────────────┘                              ▲
                                                             │ (Lưu/Đọc dữ liệu qua Repo)
                                               ┌───────────────────────────┐
                                               │      UserRepository       │
                                               │ - save(user), findById()  │
                                               └───────────────────────────┘
```

#### a. Active Record Pattern (Thiết kế thực thể động)
* **Nguyên lý:** Bản thân đối tượng Entity (Thực thể) chứa cả thuộc tính dữ liệu và các phương thức tương tác cơ sở dữ liệu.
* **Cú pháp:** `const user = new User(); user.name = "Alice"; await user.save();`
* **Đặc điểm:** Thích hợp cho ứng dụng nhỏ, viết code rất nhanh và đơn giản. Tuy nhiên nó làm tăng sự liên kết chặt chẽ và khó viết unit test.

#### b. Data Mapper Pattern (Thiết kế ánh xạ dữ liệu - NestJS khuyên dùng)
* **Nguyên lý:** Đối tượng Entity chỉ đóng vai trò thuần túy chứa dữ liệu (Pure Data Structure). Mọi thao tác lưu, xóa, sửa phải được thực hiện thông qua một Class riêng biệt gọi là **Repository (Kho lưu trữ)**.
* **Cú pháp:** `const user = new User(); await userRepository.save(user);`
* **Đặc điểm:** Tách biệt hoàn toàn DB ra khỏi Domain logic, cực kỳ dễ bảo trì và viết unit test cho các dự án lớn.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy cùng thiết kế cấu trúc Data Mapper & Repository Pattern chuẩn mực bằng TypeScript:

### Bước 1: Định nghĩa Interface trừu tượng cho Repository
```typescript
interface IUserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

### Bước 2: Định nghĩa Thực thể dữ liệu thuần túy (Entity)
```typescript
class User {
  constructor(public id: number, public name: string, public email: string) {}
}
```

### Bước 3: Hiện thực hóa Repository cụ thể cho Database (ví dụ SQL Database)
```typescript
class SQLUserRepository implements IUserRepository {
  async findById(id: number): Promise<User | null> {
    console.log(`[SQL DB] Chạy truy vấn SQL tìm User ID: ${id}`);
    // Thực tế sẽ dùng ORM để query
    return new User(id, "Alice SQL", "alice@sql.com");
  }

  async save(user: User): Promise<void> {
    console.log(`[SQL DB] Chạy lệnh INSERT/UPDATE User: ${user.name}`);
  }
}
```

### Bước 4: Viết Service nghiệp vụ sử dụng Repository qua Dependency Injection
```typescript
class UserService {
  // Service chỉ biết đến Interface, không quan tâm DB chạy cụ thể dưới nền là gì
  constructor(private userRepository: IUserRepository) {}

  async getUserDetails(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");
    
    // Xử lý logic nghiệp vụ...
    return user;
  }
}

// Khởi chạy hệ thống
const sqlRepo = new SQLUserRepository();
const userService = new UserService(sqlRepo); // Tiêm SQL Repo vào
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!IMPORTANT]
> ### Khả năng hoán đổi cơ sở dữ liệu nhanh chóng
> Nếu một ngày doanh nghiệp yêu cầu chuyển dữ liệu User sang lưu ở MongoDB để tăng tốc độ ghi. Bạn chỉ cần viết một Class mới là `MongoUserRepository implements IUserRepository` xử lý kết nối với MongoDB. 
> 
> Sau đó tiêm `MongoUserRepository` thay thế cho `SQLUserRepository` lúc khởi động ứng dụng. **Toàn bộ code trong `UserService` được giữ nguyên 100% không cần chỉnh sửa một dòng nào!**

> [!WARNING]
> ### Tránh viết logic nghiệp vụ (Business Logic) vào Repository
> Repository sinh ra chỉ để làm một nhiệm vụ duy nhất: đọc ghi dữ liệu thô (đóng vai trò như một bộ sưu tập danh sách các đối tượng trong bộ nhớ). 
> 
> Tuyệt đối không viết các logic kiểm tra quyền, tính toán hóa đơn, hay xử lý nghiệp vụ phức tạp vào trong các phương thức của Repository. Hãy để toàn bộ các việc đó ở tầng Service.
