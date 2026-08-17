## I. KHÁI QUÁT (OVERVIEW)

### 1. gRPC là gì?
Khi xây dựng hệ thống gồm nhiều dịch vụ nhỏ giao tiếp với nhau (Microservices), việc các service gọi nhau bằng API REST/JSON truyền thống lộ rõ nhiều khuyết điểm hiệu năng:
* Phải mã hóa và giải mã chuỗi văn bản JSON liên tục (rất tốn tài nguyên CPU).
* Giao thức HTTP/1.1 tạo nhiều kết nối TCP ngắn hạn gây trễ mạng.
* Không có sự ràng buộc hợp đồng kiểu dữ liệu chặt chẽ giữa các service khác ngôn ngữ (ví dụ Service Go gọi Service Node.js).

**gRPC (Google Remote Procedure Call)** là giao thức giao tiếp hiệu năng cao mã nguồn mở của Google. Nó cho phép một chương trình gọi trực tiếp một hàm trên một máy chủ khác như thể đó là một hàm cục bộ, bất kể sự khác biệt về ngôn ngữ lập trình.

---

### 2. Các cột trụ công nghệ của gRPC
gRPC đạt hiệu năng vượt trội nhờ kết hợp hai công nghệ cốt lõi:
1. **HTTP/2 làm nền tảng:** Tận dụng tối đa tính năng dồn kênh (Multiplexing) và nén Header giúp truyền tin hai chiều tốc độ cao trên 1 kết nối TCP duy nhất.
2. **Protocol Buffers (Protobuf):** Sử dụng ngôn ngữ định nghĩa giao diện (IDL) để mô tả cấu trúc dữ liệu và dịch vụ. Dữ liệu khi truyền đi sẽ được **mã hóa thành chuỗi nhị phân siêu nhỏ gọn**, nhỏ hơn JSON từ 3 đến 10 lần.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Định nghĩa Hợp đồng dữ liệu bằng file `.proto`

Mọi dịch vụ gRPC đều bắt đầu bằng việc viết một file định nghĩa `.proto` (đóng vai trò là Single Source of Truth cho tất cả các service liên quan):

```protobuf
syntax = "proto3";

package user;

// Định nghĩa dịch vụ UserService
service UserService {
  // Phương thức Unary (gửi 1 request, nhận 1 response)
  rpc GetUserById (UserRequest) returns (UserResponse);
}

// Cấu trúc gói tin Request
message UserRequest {
  int32 id = 1; // Số 1 là thẻ định danh vị trí (field tag) trong chuỗi nhị phân
}

// Cấu trúc gói tin Response
message UserResponse {
  int32 id = 1;
  string name = 2;
  string email = 3;
}
```

---

### 2. Triển khai gRPC Server trong Node.js

Node.js sử dụng hai thư viện chính là **`@grpc/grpc-js`** (lõi giao thức) và **`@grpc/proto-loader`** (để nạp file `.proto` động):

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Nạp file cấu hình proto
const packageDefinition = protoLoader.loadSync('user.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Triển khai logic cho dịch vụ
function getUserById(call, callback) {
  const userId = call.request.id; // Lấy dữ liệu truyền lên
  console.log(`Nhận yêu cầu lấy user ID: ${userId}`);
  
  // Giả lập tìm kiếm DB và trả kết quả về qua callback
  callback(null, {
    id: userId,
    name: "Alice gRPC",
    email: "alice@grpc.com"
  });
}

// Khởi chạy gRPC Server
const server = new grpc.Server();
server.addService(userProto.UserService.service, { GetUserById: getUserById });

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('gRPC Server đang chạy trên port 50051');
});
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy cùng viết một Client để gọi hàm `GetUserById` từ gRPC Server ở trên:

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('user.proto', {});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Khởi tạo Client kết nối tới Server
const client = new userProto.UserService('localhost:50051', grpc.credentials.createInsecure());

// Gọi hàm từ xa giống hệt như gọi hàm local
client.GetUserById({ id: 99 }, (error, response) => {
  if (error) {
    console.error("Lỗi gọi gRPC:", error);
    return;
  }
  console.log("Kết quả nhận được từ Server:", response);
  // Output: { id: 99, name: "Alice gRPC", email: "alice@grpc.com" }
});
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy Dynamic Loading vs Static Code Generation
> Ví dụ trên sử dụng `@grpc/proto-loader` để nạp file `.proto` động lúc runtime. Cách này tiện lợi khi viết JavaScript thông thường. 
> 
> Tuy nhiên, trong môi trường **TypeScript & NestJS chuyên nghiệp**, nạp động sẽ làm mất hoàn toàn sự kiểm tra kiểu dữ liệu (Type Safety). 
>
> **Quy tắc cốt lõi:** Luôn sử dụng bộ biên dịch Protobuf (như **`ts-proto`**) để sinh trước các interface TypeScript tĩnh từ file `.proto` lúc build, giúp IDE tự động gợi ý kiểu dữ liệu chuẩn xác khi viết code.

> [!IMPORTANT]
> ### 2. Bốn kiểu truyền dữ liệu của gRPC (gRPC Streaming Modes)
> gRPC hỗ trợ 4 chế độ truyền tải dữ liệu cực kỳ mạnh mẽ mà REST thông thường không làm được:
> 1. **Unary:** Khách hàng gửi 1 yêu cầu, máy chủ trả lời 1 phản hồi (mô hình chuẩn).
> 2. **Server Streaming:** Khách hàng gửi 1 yêu cầu, máy chủ liên tục gửi về luồng dữ liệu (Stream) kéo dài (ví dụ: luồng tin tức chứng khoán).
> 3. **Client Streaming:** Khách hàng gửi liên tục luồng dữ liệu lên, máy chủ xử lý và trả về 1 phản hồi duy nhất (ví dụ: tải file lớn chia nhỏ).
> 4. **Bidirectional Streaming (Đồng thời 2 chiều):** Cả khách hàng và máy chủ cùng truyền luồng dữ liệu cho nhau song song thời gian thực.
