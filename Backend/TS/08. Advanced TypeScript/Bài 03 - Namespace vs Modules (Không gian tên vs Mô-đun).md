## 1. Lịch sử ra đời của Namespace
Vào thời điểm TypeScript mới ra đời (năm 2012), JavaScript tiêu chuẩn vẫn chưa có cú pháp quản lý mô-đun chính thức (`import`/`export` của ES6). Các dự án khi đó thường gộp toàn bộ file JS lại chạy chung trong môi trường Global Scope, rất dễ dẫn đến lỗi trùng tên biến/hàm (global namespace pollution).

Để giải quyết vấn đề đó, TypeScript phát minh ra khái niệm **Internal Modules** (sau này đổi tên thành **Namespaces - Không gian tên**) để giúp gom nhóm các biến, class, interface có liên quan lại với nhau dưới một cái tên duy nhất.

Cú pháp:
```typescript
namespace Validation {
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }
  
  // Biến không export sẽ bị ẩn hoàn toàn bên ngoài namespace
  const lettersRegexp = /^[A-Za-z]+$/;
}
```

---

## 2. Sự xuất hiện của Modules (ES6 Modules)
Kể từ phiên bản ES6 (ES2015), JavaScript chính thức hỗ trợ **Modules**. Bất kỳ file nào có chứa từ khóa `import` hoặc `export` ở cấp cao nhất đều được coi là một Module riêng biệt, có phạm vi cô lập an toàn.

Ngày nay, Modules đã trở thành chuẩn mực công nghệ được hỗ trợ bởi tất cả các trình duyệt hiện đại và Node.js.

---

## 3. So sánh chi tiết: Namespace vs Module

| Tiêu chí | Namespaces (Không gian tên) | Modules (Mô-đun tiêu chuẩn) |
| :--- | :--- | :--- |
| **Độ thịnh hành** | **Lạc hậu (Legacy)** - Tránh dùng trong code logic thông thường. | **Chuẩn mực hiện đại** - Khuyên dùng 100% cho mọi dự án. |
| **Cách tổ chức** | Nhiều file có thể viết chung một `namespace` (dùng cấu trúc cồng kềnh `<reference path="..." />`). | Mỗi file là một module cô lập, kết nối bằng `import`/`export`. |
| **Hỗ trợ Tree Shaking** | ❌ Kém, các công cụ build khó loại bỏ code thừa. | ✅ Cực tốt, giúp tối ưu hóa dung lượng build đầu ra. |
| **Môi trường hoạt động** | Thường dùng cho các biến toàn cục chạy trực tiếp trên HTML script. | Hoạt động hoàn hảo trong Node.js, Webpack, Vite, NestJS... |

---

## 4. Khi nào Namespace vẫn hữu dụng? (Trường hợp ngoại lệ)

Mặc dù bị cấm sử dụng trong code logic thông thường, **Namespace vẫn cực kỳ quan trọng và không thể thay thế** trong việc viết các **File định nghĩa kiểu dữ liệu (`.d.ts`)**.

Chúng được dùng để mô tả cấu trúc của các thư viện JavaScript toàn cục cũ, hoặc gom nhóm các kiểu dữ liệu hệ thống mà không cần người dùng phải `import` thủ công:

```typescript
// Trong file định nghĩa kiểu toàn cục
declare namespace MyGlobalLibrary {
  interface Helper {
    process(input: string): void;
  }
}
```
*Lời khuyên cốt lõi:* Trong toàn bộ dự án NestJS hoặc Backend của bạn, hãy sử dụng **Modules** (`import`/`export`) làm tiêu chuẩn duy nhất.
