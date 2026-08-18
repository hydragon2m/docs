// Bài tập 06: Using Type Predicates
// Yêu cầu: Định nghĩa hàm kiểm tra kiểu tùy chỉnh bằng từ khóa `is`.

interface ICar {
  drive(): void;
}
interface IBoat {
  sail(): void;
}

// 1. Hãy hoàn thành hàm Type Predicate `isCar` nhận vào `vehicle` (ICar | IBoat)
// và trả về kiểu dữ liệu kiểm định `vehicle is ICar`.
function isCar(vehicle: ICar | IBoat): vehicle is ICar {
  // Hoàn thành logic trả về boolean ở đây
  return false;
}


// 2. Viết hàm `travel` nhận vào `vehicle` (ICar | IBoat) và sử dụng hàm `isCar` 
// để gọi phương thức tương ứng mà không bị báo lỗi đỏ.
function travel(vehicle: ICar | IBoat) {
  // Viết logic
}
