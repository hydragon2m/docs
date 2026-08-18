// Bài tập 06: Interface (Giao diện)
// Yêu cầu: Sử dụng Interface để thiết kế cấu trúc dữ liệu theo các yêu cầu dưới đây.

// 1. Khai báo Cơ bản & Phương thức
// Định nghĩa interface `IVehicle` gồm:
// - make (string)
// - model (string)
// - startEngine(): void (hàm không trả về gì)
// Khai báo một biến `myCar` kiểu `IVehicle` và viết code chạy thử phương thức startEngine.


// 2. Kế thừa Interface (Interface Inheritance)
// Định nghĩa interface `IPerson` gồm `name` (string) và `age` (number).
// Định nghĩa interface `IEmployee` kế thừa `IPerson` và thêm thuộc tính `employeeId` (number), `salary` (number).
// Khai báo đối tượng `staff` kiểu `IEmployee` chứa đầy đủ các thuộc tính của cả 2 interface.


// 3. Gộp khai báo (Declaration Merging)
// Khai báo interface `IProduct` gồm: `id` (number) và `name` (string).
// Tiếp tục khai báo thêm interface `IProduct` lần thứ 2 để bổ sung thuộc tính: `price` (number).
// Tạo một biến `laptop` kiểu `IProduct` để chứng minh cơ chế gộp khai báo hoạt động thành công.
