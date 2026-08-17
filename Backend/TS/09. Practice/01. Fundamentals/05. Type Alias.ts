// Bài tập 05: Type Alias (Bí danh kiểu dữ liệu)
// Yêu cầu: Sử dụng Type Alias để giải quyết các bài toán dưới đây.

// 1. Gộp kiểu dữ liệu (Intersection Type)
// Hãy định nghĩa 3 Type Aliases:
// - `UserAccount`: chứa `username` (string) và `password` (string).
// - `UserProfile`: chứa `displayName` (string) và `avatarUrl` (string).
// - `FullMember`: gộp cả hai kiểu trên lại bằng toán tử `&`.
// Khai báo một biến `member` kiểu `FullMember` và gán giá trị hợp lệ.


// 2. Định nghĩa kiểu đệ quy (Recursive Type Alias)
// Hãy tạo một Type Alias tên là `CommentNode` để mô tả cấu trúc của một bình luận lồng nhau (nested comments):
// - id (number)
// - content (string)
// - replies (mảng chứa các bình luận con có cùng kiểu CommentNode - gợi ý: CommentNode[] hoặc có thể là optional)
// Khai báo một biến `rootComment` kiểu `CommentNode` chứa ít nhất một bình luận con bên trong.


// 3. Cơ chế Structural Typing (Đọc và Trả lời câu hỏi)
type Width = { value: number };
type Height = { value: number };

let w: Width = { value: 100 };
let h: Height = w; 
// Câu hỏi: Dòng code gán `h = w` trên có bị lỗi trong TypeScript không? Tại sao?
// Trả lời (viết comment tại đây):
