// Bài tập 03: Conditional Types (Kiểu điều kiện)
// Yêu cầu: Viết các kiểu điều kiện rẽ nhánh và sử dụng từ khóa `infer`.

// 1. Conditional basic:
// Định nghĩa kiểu `IsArray<T>`: Nếu T là một mảng (T extends any[]), trả về kiểu `true`, ngược lại trả về `false`.
type IsArray<T> = any; // Sửa lại dòng này
type Test1 = IsArray<string[]>; // Phải trả về true
type Test2 = IsArray<string>;   // Phải trả về false


// 2. Sử dụng `infer`:
// Định nghĩa một kiểu `GetPromiseType<T>`: 
// - Nếu T là một Promise chứa kiểu dữ liệu Value (T extends Promise<infer Value>), trả về kiểu `Value`.
// - Ngược lại, trả về chính kiểu `T`.
type GetPromiseType<T> = any; // Sửa lại dòng này
type Test3 = GetPromiseType<Promise<number>>; // Phải trả về number
type Test4 = GetPromiseType<string>;          // Phải trả về string
