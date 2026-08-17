// Bài tập 07: Discriminated Unions & Exhaustiveness Checking
// Yêu cầu: Triển khai Discriminated Union và Exhaustiveness Checking bằng kiểu `never`.

interface ISuccessResponse {
  status: "success";
  data: string;
}

interface IErrorResponse {
  status: "error";
  errorMessage: string;
}

// 1. Gộp hai interface trên thành một Union Type `APIResponse`.
type APIResponse = ISuccessResponse | IErrorResponse;


// 2. Viết hàm `handleAPIResponse` nhận vào `response` kiểu `APIResponse`.
// - Sử dụng cấu trúc switch-case để kiểm tra thuộc tính `status`.
// - Trả về `data` nếu thành công, hoặc `errorMessage` nếu thất bại.
// - Triển khai Exhaustiveness Checking ở nhánh `default` bằng cách gán `response` vào một biến kiểu `never`.
function handleAPIResponse(response: APIResponse): string {
  // Thực hiện viết switch-case và checking tại đây
  return "";
}
