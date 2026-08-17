// Bài tập 05: Generic Utility Types (Tự thiết kế các Utility Types)
// Yêu cầu: Tự viết lại cấu trúc của các Utility Types sử dụng Generic và Mapped Types.

interface IUser {
  id: number;
  username: string;
  email: string;
}

// 1. Hãy tự viết kiểu `MyPartial<T>` và áp dụng để tạo kiểu `PartialUser` từ `IUser`.
type MyPartial<T> = any; // Sửa lại dòng này
type PartialUser = MyPartial<IUser>;


// 2. Hãy tự viết kiểu `MyReadonly<T>` và áp dụng để tạo kiểu `ReadonlyUser` từ `IUser`.
type MyReadonly<T> = any; // Sửa lại dòng này
type ReadonlyUser = MyReadonly<IUser>;


// 3. Hãy tự viết kiểu `MyRequired<T>` (sử dụng toán tử -? loại bỏ optional) để biến đổi kiểu:
interface IOptionalProfile {
  bio?: string;
  avatarUrl?: string;
}
// Thành kiểu dữ liệu bắt buộc `RequiredProfile`:
type MyRequired<T> = any; // Sửa lại dòng này
type RequiredProfile = MyRequired<IOptionalProfile>;
