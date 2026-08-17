## I. KHÁI QUÁT (OVERVIEW)

### 1. Kim tự tháp kiểm thử (Testing Pyramid)
Trong phát triển phần mềm chuyên nghiệp, kiểm thử (Testing) được cấu trúc theo mô hình kim tự tháp:

```text
       /   E2E Test   \      ◄── Số lượng ít, chạy chậm nhất, chi phí cao nhất
      /  Integration   \     ◄── Kiểm thử tích hợp giữa các bộ phận
     /     Unit Test     \    ◄── Số lượng nhiều nhất, chạy cực nhanh, chi phí thấp nhất
    ───────────────────────
```

* **Unit Test (Kiểm thử đơn vị):** Kiểm tra tính đúng đắn của từng khối code nhỏ nhất hoàn toàn độc lập (thường là một hàm hoặc một phương thức của Class). Mọi giao tiếp với bên ngoài (gọi DB, gọi API) đều bắt buộc phải được giả lập (**Mock**).
* **Integration Test (Kiểm thử tích hợp):** Kiểm tra sự kết hợp hoạt động giữa 2 hay nhiều bộ phận của hệ thống (ví dụ kiểm tra Service kết nối thực tế với DB).
* **E2E Test (End-to-End):** Kiểm tra toàn bộ luồng hệ thống từ đầu đến cuối từ góc nhìn người dùng.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Quy trình viết Test: Quy tắc AAA (Arrange - Act - Assert)

Mỗi test case đơn lẻ nên tuân thủ cấu trúc 3 phần rõ ràng:

1. **Arrange (Chuẩn bị):** Thiết lập môi trường, khởi tạo các đối tượng và dữ liệu đầu vào, thiết lập các hàm giả lập (Mocks).
2. **Act (Thực thi):** Gọi hàm hoặc phương thức cần kiểm thử với dữ liệu đã chuẩn bị.
3. **Assert (Khẳng định):** Đối chiếu kết quả trả về thực tế với kết quả mong đợi xem có khớp nhau hay không.

```javascript
test('Hàm cộng hai số', () => {
  // Arrange
  const a = 5;
  const b = 10;

  // Act
  const result = add(a, b);

  // Assert
  expect(result).toBe(15);
});
```

---

### 2. Kỹ thuật Giả lập (Mocking & Spying) trong Jest

Khi viết Unit Test cho một Service (ví dụ `UserService`), bạn không được phép kết nối Database thật. Bạn cần sử dụng các công cụ giả lập của **Jest** để cô lập Service đó:

#### a. `jest.fn()` (Tạo hàm giả lập)
Tạo ra một hàm trống giả lập không có logic thực tế, cho phép bạn tự định cấu hình giá trị trả về và kiểm tra xem hàm đó đã được gọi hay chưa.

```javascript
const mockQuery = jest.fn().mockResolvedValue([{ id: 1, name: "Alice" }]);
```

#### b. `jest.spyOn()` (Theo dõi hàm thực tế)
Bọc xung quanh một phương thức đang tồn tại của đối tượng, cho phép bạn theo dõi lịch sử gọi hàm (hàm được gọi bao nhiêu lần, truyền đối số gì) mà không cần thay thế logic của hàm đó.

#### c. `jest.mock()` (Giả lập toàn bộ module)
Thay thế toàn bộ các export của một thư viện bên ngoài (ví dụ thư viện gọi HTTP `axios` hoặc thư viện DB `pg`) bằng các hàm giả lập tự định nghĩa.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy cùng viết một Unit Test hoàn chỉnh sử dụng Jest để test class `UserService` có phụ thuộc vào `UserRepository`:

### Class cần test (`UserService.js`):
```javascript
class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getAgeDescription(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    
    return `${user.name} is ${user.age} years old.`;
  }
}
module.exports = UserService;
```

### File viết Test (`UserService.test.js`):
```javascript
const UserService = require('./UserService');

describe('UserService - getAgeDescription', () => {
  
  test('Phải trả về mô tả tuổi chính xác nếu tìm thấy User (Case Success)', async () => {
    // 1. Arrange (Chuẩn bị Mock Repository)
    const mockUserRepository = {
      // Giả lập findById luôn trả về đối tượng user thành công
      findById: jest.fn().mockResolvedValue({ name: "Bob", age: 30 }) 
    };
    const userService = new UserService(mockUserRepository);

    // 2. Act (Thực thi)
    const result = await userService.getAgeDescription(101);

    // 3. Assert (Khẳng định)
    expect(result).toBe("Bob is 30 years old.");
    // Kiểm tra xem Repo đã được gọi đúng tham số 101 chưa
    expect(mockUserRepository.findById).toHaveBeenCalledWith(101); 
  });

  test('Phải ném ra lỗi nếu không tìm thấy User (Case Failure)', async () => {
    // 1. Arrange
    const mockUserRepository = {
      findById: jest.fn().mockResolvedValue(null) // Giả lập trả về null (không tìm thấy)
    };
    const userService = new UserService(mockUserRepository);

    // 2. Act & Assert
    await expect(userService.getAgeDescription(999))
      .rejects
      .toThrow("User not found");
  });
});
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy viết Unit Test chọc vào Database thật
> Nếu Unit Test của bạn tạo kết nối tới Database Postgres thật chạy ở Local:
> * Tốc độ chạy test sẽ bị chậm đi đáng kể (Unit Test tiêu chuẩn phải chạy xong hàng trăm test case dưới 1 giây).
> * Dữ liệu rác sinh ra trong lúc chạy test sẽ làm bẩn Database.
> * Các máy tính khác trong team hoặc máy chủ CI/CD tự động khi build sẽ bị lỗi đỏ vì không có sẵn Database local để kết nối.
>
> **Quy tắc cốt lõi:** Luôn cô lập hoàn toàn môi trường, chỉ dùng dữ liệu giả lập (Mock) cho Unit Test.

> [!TIP]
> ### 2. Đo lường mức độ bao phủ (Test Coverage)
> Jest tích hợp sẵn công cụ đo lường độ bao phủ mã nguồn. Bạn chỉ cần chạy lệnh:
> ```bash
> jest --coverage
> ```
> Jest sẽ xuất ra một bảng báo cáo chi tiết chỉ ra chính xác dòng code nào trong dự án của bạn đã có test và dòng nào chưa có test.
