// Bài tập 02: Indexed Access Types (Kiểu truy cập chỉ mục)
// Yêu cầu: Trích xuất kiểu của các thuộc tính con và phần tử mảng.

interface ICompany {
  name: string;
  departments: {
    name: string;
    manager: {
      name: string;
      email: string;
    };
  }[]; // departments là một mảng đối tượng
}

// 1. Hãy lấy ra kiểu dữ liệu của đối tượng quản lý (manager) bên trong phòng ban.
// Gợi ý: đi qua từng tầng thuộc tính kết hợp [number] hoặc ['departments'][number]...
type ManagerType = any; // Sửa lại dòng này


// 2. Trích xuất kiểu phần tử của mảng:
const responseItems = [
  { id: 1, type: "banner", content: "hello" },
  { id: 2, type: "popup", content: "welcome" }
];
// Hãy dùng typeof và [number] để trích xuất ra kiểu dữ liệu của một phần tử đơn lẻ `ResponseItem`.
type ResponseItem = any; // Sửa lại dòng này
