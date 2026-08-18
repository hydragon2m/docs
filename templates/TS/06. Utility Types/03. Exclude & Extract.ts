// Bài tập 03: Exclude & Extract
// Yêu cầu: Sử dụng Exclude và Extract để thao tác với Union Types.

type AppPermissions = "read:user" | "write:user" | "delete:user" | "read:system" | "write:system";

// 1. Dùng `Exclude`:
// Tạo kiểu `UserScopePermissions` loại bỏ tất cả các quyền hệ thống (chứa chữ "system"):
// Loại bỏ "read:system" và "write:system" khỏi `AppPermissions`.


// 2. Dùng `Extract`:
// Tạo kiểu `ReadPermissions` chỉ giữ lại các quyền đọc (chứa chữ "read") trong `AppPermissions`
// (Gợi ý: Chỉ lấy "read:user" | "read:system").


// 3. Kết hợp keyof:
interface ITask {
  id: number;
  title: string;
  isCompleted: boolean;
  assignedTo: string;
}
// Hãy dùng Exclude kết hợp với keyof để tạo ra kiểu `EditableTaskKeys` 
// chứa tất cả các key của ITask ngoại trừ key 'id'.
type EditableTaskKeys = any; // Sửa lại dòng này
