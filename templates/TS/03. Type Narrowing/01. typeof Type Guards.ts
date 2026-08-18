// Bài tập 01: typeof Type Guards
// Yêu cầu: Sử dụng typeof để viết code kiểm tra kiểu an toàn.

// 1. Viết hàm `doubleValue` nhận vào một tham số `input` có kiểu `number | string`.
// - Nếu là number: trả về input * 2.
// - Nếu là string: trả về input lặp lại 2 lần (ví dụ: "abc" -> "abcabc").
function doubleValue(input: number | string): number | string {
  // Thực hiện viết logic tại đây
  return "";
}


// 2. Sửa lỗi cạm bẫy typeof null:
// Viết hàm `printObjectKeys` nhận vào `obj` kiểu `object | null`.
// Sử dụng typeof để kiểm tra và in ra toàn bộ key của đối tượng (Object.keys(obj)).
// Hãy chắc chắn chương trình không bị lỗi crash compile/runtime khi obj truyền vào là null.
function printObjectKeys(obj: object | null) {
  // Viết logic tại đây
}
