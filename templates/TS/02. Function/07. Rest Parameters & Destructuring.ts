// Bài tập 07: Rest Parameters & Destructuring (Tham số Rest & Giải nén đối số)
// Yêu cầu: Viết các hàm nhận tham số rest hoặc dùng kỹ thuật giải nén đối số đúng cách.

// 1. Rest Parameters kết hợp Tuple Types
// Cho kiểu Tuple đại diện cho các tham số cấu hình server:
type ServerConfig = [host: string, port: number, secure: boolean];

// Hãy định nghĩa hàm `startServer` nhận vào tham số rest kiểu `ServerConfig`
// và viết code giải nén các tham số đó trong thân hàm để in ra màn hình.
function startServer() {
  // Logic
}


// 2. Destructuring Arguments
// Định nghĩa một Type Alias `UserSession` gồm `userId` (number) và `roles` (string[]).
// Viết hàm `checkAdmin` nhận vào đối tượng kiểu `UserSession`, thực hiện giải nén trực tiếp 
// các thuộc tính này tại chữ ký hàm và trả về `true` nếu mảng `roles` chứa chuỗi "ADMIN".
function checkAdmin() {
  // Logic
}
