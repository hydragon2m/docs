// Bài tập 05: ReturnType & Awaited
// Yêu cầu: Trích xuất kiểu dữ liệu trả về của hàm và Promise.

// 1. Dùng `ReturnType`:
// Cho hàm factory tạo cấu trúc cấu hình sau:
function generateConfig() {
  return {
    environment: "production",
    port: 8080,
    features: {
      enableCache: true,
      enableLogging: false
    }
  };
}

// Hãy trích xuất kiểu dữ liệu trả về của hàm `generateConfig` thành một Type Alias `AppConfiguration`.
// Khai báo một biến cấu hình mẫu kiểu `AppConfiguration`.
type AppConfiguration = any; // Sửa lại dòng này


// 2. Dùng `Awaited`:
// Cho hàm bất đồng bộ lấy dữ liệu sản phẩm từ cơ sở dữ liệu:
async function getProductById(id: number) {
  return {
    id,
    sku: "SKU-990",
    name: "Mechanical Keyboard",
    price: 1200000
  };
}

// Hãy giải nén kiểu của Promise trả về từ hàm `getProductById` thành kiểu thực tế `ProductEntity`
// (sử dụng kết hợp ReturnType và Awaited).
type ProductEntity = any; // Sửa lại dòng này
