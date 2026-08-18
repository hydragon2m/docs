// Bài tập 04: NonNullable & Parameters
// Yêu cầu: Loại bỏ giá trị rỗng và trích xuất tham số của hàm.

// 1. Dùng `NonNullable`:
type Token = string | null | undefined;
// Hãy khai báo kiểu `ActiveToken` loại bỏ hoàn toàn null và undefined khỏi `Token`.


// 2. Dùng `Parameters`:
// Cho một hàm từ một thư viện ngoài như sau:
function setupConnection(host: string, port: number, options: { retry: boolean; timeout: number }) {
  console.log(`Connecting to ${host}:${port}`);
}

// Yêu cầu: Hãy trích xuất kiểu tham số của hàm `setupConnection` trên thành một kiểu Tuple `ConnectionParams`.
// Sau đó viết một hàm bọc `myLoggerConnectionWrapper` nhận vào tham số rest có kiểu `ConnectionParams` 
// và gọi lại hàm `setupConnection` bên trong.
type ConnectionParams = any; // Sửa lại dòng này
function myLoggerConnectionWrapper() {
  // Viết code nhận tham số và gọi lại hàm setupConnection
}
