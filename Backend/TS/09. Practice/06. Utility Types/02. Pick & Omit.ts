// Bài tập 02: Pick & Omit
// Yêu cầu: Sử dụng Pick và Omit để chọn lọc/loại bỏ thuộc tính đối tượng.

interface IMember {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  joinedDate: Date;
}

// 1. Dùng `Pick`:
// Tạo kiểu `MemberContact` chỉ chứa `name` và `email` từ `IMember`.
// Khai báo một biến mẫu sử dụng kiểu này.


// 2. Dùng `Omit`:
// Tạo kiểu `MemberPublicInfo` loại bỏ thuộc tính `passwordHash` khỏi `IMember`.
// Khai báo một biến mẫu sử dụng kiểu này.


// 3. Phân tích độ an toàn (Đọc hiểu và trả lời):
// Nếu bạn đổi tên thuộc tính `passwordHash` trong interface `IMember` thành `hashedPassword`.
// Hỏi: Cú pháp `Pick` hay `Omit` ở trên sẽ phát hiện lỗi và báo đỏ dòng code cho bạn biết ngay lập tức?
// Trả lời:
