// Bài tập 04: Mapped Types (Kiểu ánh xạ)
// Yêu cầu: Định nghĩa kiểu ánh xạ thuộc tính đối tượng nâng cao.

interface ISession {
  token: string;
  expiresIn: number;
}

// 1. Hãy viết một kiểu `ReadonlyNullable<T>` ánh xạ qua toàn bộ thuộc tính của T:
// - Thêm readonly cho mỗi thuộc tính.
// - Ép kiểu dữ liệu của mỗi thuộc tính thành kiểu gốc OR null (T[P] | null).
type ReadonlyNullable<T> = any; // Sửa lại dòng này
type NullableSession = ReadonlyNullable<ISession>;
// NullableSession tương đương: { readonly token: string | null; readonly expiresIn: number | null }


// 2. Remapping key với `as`:
// Hãy viết một kiểu `OptionalGetters<T>` đổi tên toàn bộ key P của T thành `get${Capitalize<string & P>}`
// và biến kiểu trị thành một hàm trả về T[P] hoặc optional.
type OptionalGetters<T> = any; // Sửa lại dòng này
type SessionGetters = OptionalGetters<ISession>;
// SessionGetters tương đương: { getToken?: () => string; getExpiresIn?: () => number; }
