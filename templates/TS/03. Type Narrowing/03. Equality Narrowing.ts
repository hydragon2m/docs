// Bài tập 03: Equality Narrowing (So sánh bằng)
// Yêu cầu: Sử dụng phép so sánh để thu hẹp kiểu.

// 1. So sánh 2 biến khác kiểu:
// Viết hàm `syncData` nhận vào `input` (string | number) và `state` (string | boolean).
// Kiểm tra nếu `input === state`. Khi đó, in ra chuỗi chữ in hoa của `input` (.toUpperCase()).
function syncData(input: string | number, state: string | boolean) {
  // Viết logic tại đây
}


// 2. Mẹo so sánh lỏng với null/undefined:
// Viết hàm `parseMetadata` nhận vào `meta` (object | null | undefined).
// Sử dụng duy nhất 1 câu lệnh so sánh lỏng `!=` để loại bỏ cả null và undefined trước khi in ra đối tượng.
function parseMetadata(meta: object | null | undefined) {
  // Viết logic tại đây
}
