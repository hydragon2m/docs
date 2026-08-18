// Bài tập 01: Generic Types & Interfaces
// Yêu cầu: Định nghĩa các kiểu và giao diện sử dụng Generic để tái sử dụng.

// 1. Định nghĩa một Generic Interface `IResultWrapper<T>` đại diện cho một gói kết quả gồm:
// - success (boolean)
// - payload (kiểu T - chứa dữ liệu thực tế)
// - errorCode (number - tùy chọn)
// Sau đó khai báo biến `userResult` kiểu `IResultWrapper<{ name: string }>` và gán giá trị hợp lệ.


// 2. Định nghĩa Generic Type Alias `Dictionary<T>` đại diện cho một đối tượng có thuộc tính động 
// dạng key-value, với key là `string` và value là kiểu `T`.
// Khai báo một biến `ageMap` sử dụng kiểu `Dictionary<number>` gán giá trị mẫu.
