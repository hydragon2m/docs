// Bài tập 01: keyof & typeof operators
// Yêu cầu: Trích xuất kiểu từ giá trị và lấy danh sách key nâng cao.

// 1. Dùng `typeof`:
const databaseConfig = {
  dbName: "prod_db",
  maxConnections: 100,
  replication: {
    enabled: true,
    nodes: ["replica-1", "replica-2"]
  }
};
// Hãy trích xuất kiểu dữ liệu của đối tượng databaseConfig trên thành Type Alias `DbConfigType`.


// 2. Dùng `keyof typeof` kết hợp:
const userRoles = {
  ADMIN: "administrator",
  MODERATOR: "moderator",
  USER: "regular_user"
};
// Hãy tạo một kiểu `RoleKeys` chứa tập hợp các key của đối tượng userRoles ở trên.
// Khai báo biến `role` kiểu `RoleKeys` nhận một giá trị hợp lệ.
type RoleKeys = any; // Sửa lại dòng này
