// Bài tập 02: Type Inference (Suy luận kiểu dữ liệu)
// Yêu cầu: Đọc kỹ các đoạn code dưới đây và trả lời/sửa lỗi theo hướng dẫn.

// 1. Dựa vào cơ chế Type Inference, hãy cho biết biến `message` dưới đây tự động có kiểu dữ liệu gì?
// Trả lời (comment bên cạnh): kiểu dữ liệu là gì?
let message = "Welcome to TypeScript!";


// 2. Đoạn code dưới đây bị lỗi biên dịch. Hãy giải thích tại sao ở comment bên dưới.
let totalItems = 50;
// totalItems = "out of stock"; // Dòng này bị lỗi. Tại sao?
// Giải thích: 


// 3. Khai báo biến `result` dưới đây đang bị suy luận ra kiểu `any` (implicit any).
// Hãy sửa lại dòng này bằng cách sử dụng Type Annotation để biến này chỉ chấp nhận kiểu `number`.
let result;
result = 100;
