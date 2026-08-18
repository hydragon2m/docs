// Bài tập 05: Nominal Typing (Kiểu định danh)
// Yêu cầu: Triển khai Branded Types để ngăn lỗi logic cộng nhầm đơn vị dữ liệu.

// 1. Hãy tạo 2 kiểu dữ liệu Branded Types mô tả:
// - `Meters` (kiểu number & brand)
// - `Seconds` (kiểu number & brand)
//
// Gợi ý: dùng unique symbol hoặc khai báo cấu trúc giao nhau làm nhãn thương hiệu.


// 2. Viết các hàm helper khởi tạo:
// - `makeMeters(val: number): Meters`
// - `makeSeconds(val: number): Seconds`


// 3. Thử nghiệm:
// Khai báo biến `distance` kiểu `Meters` và `duration` kiểu `Seconds`.
// Thử gán chéo hoặc cộng chéo xem TypeScript có báo đỏ lỗi kiểu dữ liệu để ngăn bạn không.
