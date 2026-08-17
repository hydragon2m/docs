// Bài tập 04: gRPC (Giao tiếp hiệu năng cao giữa các Microservices)
// Yêu cầu: Khởi chạy gRPC server nạp file `user.proto` đã định nghĩa.

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// 1. Nạp file user.proto bằng protoLoader.loadSync.
// 2. Định nghĩa hàm handler `getUserById` nhận vào `call` và `callback`.
//    Trả về thông tin giả lập của user tương ứng với call.request.id.
// 3. Khởi chạy gRPC server trên port 50051.
