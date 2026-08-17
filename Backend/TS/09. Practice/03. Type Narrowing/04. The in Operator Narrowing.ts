// Bài tập 04: The in Operator Narrowing
// Yêu cầu: Sử dụng toán tử `in` để phân biệt các kiểu đối tượng trong union.

interface IAdmin {
  name: string;
  role: string;
  manageUsers(): void;
}

interface IGuest {
  name: string;
  temporaryToken: string;
  browse(): void;
}

// Viết hàm `handleLogin` nhận vào `session` (kiểu IAdmin | IGuest).
// Dùng toán tử `in` để kiểm tra thuộc tính độc nhất của admin hoặc guest.
// - Nếu là Admin: thực thi hàm `manageUsers()`.
// - Nếu là Guest: thực thi hàm `browse()`.
function handleLogin(session: IAdmin | IGuest) {
  // Viết logic tại đây
}
