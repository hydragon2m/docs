// Bài tập 02: Declaration Merging & Ambient Modules
// Yêu cầu: Viết định nghĩa file kiểu mở rộng cấu trúc sẵn có.

// 1. Mở rộng kiểu dữ liệu Global:
// Hãy giả lập việc gộp khai báo (Declaration Merging) để bổ sung thêm thuộc tính 
// `jwtSecret` kiểu `string` vào trong interface `ProcessEnv` của namespace `NodeJS` toàn cục.
// (Viết khai báo declare global/namespace NodeJS/interface ProcessEnv).


// 2. Mở rộng kiểu đối tượng Express Request:
// Giả lập đối tượng Request của Express có sẵn:
interface ExpressRequest {
  url: string;
  method: string;
}

// Yêu cầu: Hãy viết dòng code khai báo gộp để bổ sung thuộc tính `user` kiểu `{ name: string }`
// vào interface `ExpressRequest` trên.
