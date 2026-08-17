// Bài tập 10: Literal Types (Kiểu giá trị cụ thể)
// Yêu cầu: Sử dụng Literal Types kết hợp Union Types để giới hạn tập hợp giá trị an toàn.

// 1. Hãy định nghĩa một Type Alias `TrafficLight` giới hạn 3 màu đèn giao thông cụ thể:
// "red", "yellow", "green".
// Định nghĩa hàm `checkLight` nhận vào tham số `light` kiểu `TrafficLight` và in ra thông báo tương ứng.


// 2. Khắc phục lỗi Literal Inference (Object Literal)
// Cho hàm gửi yêu cầu HTTP sau:
type HTTPMethod = "GET" | "POST" | "DELETE";
function sendRequest(url: string, method: HTTPMethod) {
  console.log(`Sending to ${url} with method ${method}`);
}

// Đối tượng config sau đây đang bị suy luận kiểu rộng hơn (method: string):
const requestConfig = {
  url: "https://api.myapp.com/data",
  method: "POST"
};

// Dòng dưới đây đang bị báo lỗi đỏ:
// sendRequest(requestConfig.url, requestConfig.method);

// Yêu cầu: Hãy sửa đổi khai báo hoặc dùng tính năng TS nâng cao học ở Bài 10 
// để dòng gọi hàm `sendRequest` ở trên không còn bị báo lỗi.
