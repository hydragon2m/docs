// Bài tập 02: Call & Construct Signatures
// Yêu cầu: Khai báo các Interface sử dụng Call hoặc Construct Signatures.

// 1. Call Signatures
// Định nghĩa interface `ISimpleCalculator` mô tả một hàm:
// - Có thể gọi như một hàm nhận vào `a` (number), `b` (number) và trả về `number`.
// - Có thuộc tính `operatorName` (string).
// Tạo một biến `sumCalc` kiểu `ISimpleCalculator` thực thi phép cộng và gán thuộc tính operatorName là "Addition".


// 2. Construct Signatures
// Định nghĩa interface `IUserConstructor` mô tả một Constructor (hàm khởi tạo bằng từ khóa `new`):
// - Nhận vào `username` (string).
// - Trả về một đối tượng có cấu trúc `{ username: string; login(): void }`.
// Định nghĩa class `AppUser` thực thi cấu trúc trả về trên, và viết hàm factory `createUser` 
// nhận vào một constructor kiểu `IUserConstructor` để tạo mới instance.
