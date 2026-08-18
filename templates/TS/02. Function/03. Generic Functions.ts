// Bài tập 03: Generic Functions (Hàm Generic)
// Yêu cầu: Sử dụng Generic và Constraints để viết các hàm an toàn kiểu dữ liệu.

// 1. Hàm Generic Cơ bản
// Viết hàm `swap` nhận vào một Tuple chứa 2 phần tử kiểu [T, U] và trả về một Tuple mới đã đảo vị trí: [U, T].
function swap(pair) {
  // Viết logic tại đây
}


// 2. Ràng buộc Generic (Generic Constraints)
// Định nghĩa interface `IHasId` gồm thuộc tính `id` (string hoặc number).
// Viết hàm `findItemById` nhận vào:
// - Một mảng `list` các phần tử kế thừa `IHasId`.
// - Một `id` cần tìm (string hoặc number).
// Hàm trả về phần tử tìm được hoặc `undefined`.
function findItemById(list, id) {
  // Viết logic tại đây
}
