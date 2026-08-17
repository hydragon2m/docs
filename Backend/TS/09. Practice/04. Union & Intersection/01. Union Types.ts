// Bài tập 01: Union Types (Kiểu kết hợp)
// Yêu cầu: Sử dụng Union Types để định nghĩa kiểu dữ liệu linh hoạt.

// 1. Định nghĩa Type Alias `ID` có thể là `string` hoặc `number`.
// Khai báo hàm `printId` nhận vào `id` kiểu `ID` và in ra ID đó.
type ID = string | number;
function printId(id: ID) {
  // Viết logic
}


// 2. Phân biệt kiểu mảng:
// Hãy khai báo biến `numberOrStringList` kiểu mảng chứa hỗn hợp cả string và number (ví dụ: [1, "two", 3]).
let numberOrStringList;

// Hãy khai báo biến `pureList` kiểu: hoặc là mảng toàn string, hoặc là mảng toàn number.
// Thử gán giá trị mẫu và giải thích xem gán [1, "two"] có bị lỗi compile không.
let pureList;
