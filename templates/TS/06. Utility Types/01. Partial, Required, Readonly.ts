// Bài tập 01: Partial, Required, Readonly
// Yêu cầu: Sử dụng các Utility Types nhóm Modifiers để thay đổi trạng thái thuộc tính.

interface IProfile {
  id: number;
  displayName?: string;
  avatarUrl?: string;
  settings: {
    theme: "light" | "dark";
  }
}

// 1. Dùng `Partial`:
// Khai báo một kiểu `ProfileUpdate` cho phép cập nhật tùy chọn các trường của `IProfile`.
// Tạo biến `myUpdate` chứa một trường cập nhật hợp lệ.


// 2. Dùng `Required`:
// Khai báo một kiểu `CompleteProfile` bắt buộc phải có đầy đủ toàn bộ trường của `IProfile`.
// Giải thích xem trường `displayName` có bắt buộc phải khai báo khi gán kiểu này hay không.


// 3. Sửa lỗi Deep Immutability (Readonly nâng cao):
// Dưới đây là biến config sử dụng Readonly thông thường:
const config: Readonly<IProfile> = {
  id: 1,
  settings: { theme: "light" }
};
// Dòng dưới đây vẫn thay đổi được giá trị thuộc tính lồng nhau:
config.settings.theme = "dark"; 

// Yêu cầu: Hãy định nghĩa kiểu `DeepReadonly<T>` đệ quy đã học ở lý thuyết Bài 01
// và áp dụng nó cho biến config trên để cấm sửa đổi thuộc tính ở mọi tầng con.
