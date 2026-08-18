// Bài tập 02: Generic Classes (Lớp Generic)
// Yêu cầu: Định nghĩa Class Generic và giải quyết các ràng buộc thành viên tĩnh.

// 1. Tạo một Generic Class `DataRepository<T>` chứa một mảng private `items: T[]`.
// Viết các phương thức public:
// - add(item: T): void (thêm phần tử)
// - getAll(): T[] (lấy ra toàn bộ phần tử)
// Khởi tạo một thực thể repository cho kiểu dữ liệu `string` và chạy thử.


// 2. static method với Generic:
// Định nghĩa một Class `JSONUtility`. Hãy viết một phương thức `static` tên là `stringifyData<T>` 
// nhận vào một tham số `data` kiểu `T` và trả về một chuỗi string (sử dụng JSON.stringify).
// Đảm bảo không sử dụng tham số kiểu của Class cho phương thức static này.
