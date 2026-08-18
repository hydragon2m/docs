// Bài tập 02: Truthiness Narrowing (Chân trị)
// Yêu cầu: Sử dụng kiểm tra chân trị an toàn và tránh các bẫy falsy values.

// 1. Viết hàm `formatList` nhận vào một danh sách các chuỗi `items` (kiểu string[] hoặc null hoặc undefined).
// Hãy viết hàm check điều kiện chân trị (truthiness) để chắc chắn danh sách có dữ liệu trước khi
// thực hiện ghép các phần tử bằng phương thức `.join(", ")`. 
// Nếu không có dữ liệu, trả về chuỗi rỗng "".
function formatList(items: string[] | null | undefined): string {
  // Logic
  return "";
}


// 2. Sửa lỗi logic Falsy:
// Hàm `showProductQuantity` nhận vào số lượng sản phẩm `qty` (kiểu number hoặc undefined).
// Nếu bạn viết `if (qty)` thì số 0 truyền vào sẽ bị bỏ qua (được coi là không có số lượng).
// Hãy viết code sửa lỗi này để số 0 vẫn được in ra đúng dạng: "Quantity: 0".
function showProductQuantity(qty: number | undefined) {
  // Sửa lại logic tại đây
}
