// Bài tập 02: Intersection Types (Kiểu giao nhau)
// Yêu cầu: Sử dụng Intersection Types để tổ hợp các kiểu cấu trúc.

interface ILoggable {
  log(msg: string): void;
}

interface ISerializable {
  serialize(): string;
}

// 1. Hãy định nghĩa một Type Alias `DataPlugin` giao nhau giữa `ILoggable` và `ISerializable`.
// Khai báo một đối tượng `myPlugin` kiểu `DataPlugin` thực thi đầy đủ thuộc tính của cả hai.


// 2. Xung đột thuộc tính trong Intersection:
interface IA {
  version: string;
}
interface IB {
  version: number;
}
type IC = IA & IB;

// Hỏi: Hãy comment giải thích kiểu dữ liệu thực tế của thuộc tính `version` trong kiểu `IC` là gì?
// Trả lời:
