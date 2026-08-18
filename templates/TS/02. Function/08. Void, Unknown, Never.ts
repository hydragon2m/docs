// Bài tập 08: Void, Unknown, Never
// Yêu cầu: Sử dụng các kiểu trả về đặc biệt cho hàm phù hợp với ngữ cảnh logic.

// 1. Kiểu `never`
// Viết hàm `fail` nhận vào một `message` (string) và luôn luôn ném ra lỗi (throw new Error(message)).
// Hãy chú thích kiểu trả về phù hợp cho hàm này.


// 2. Kiểu `unknown`
// Viết hàm `safelyParse` nhận vào `jsonStr` (string) và trả về dữ liệu kiểu `unknown` (sử dụng JSON.parse).
// Tiếp tục viết code sử dụng hàm đó để parse một chuỗi JSON, sau đó viết block kiểm tra kiểu (Type Guard)
// để chắc chắn dữ liệu trả về là một Object chứa thuộc tính `id` kiểu `number` trước khi in ra ID đó.
