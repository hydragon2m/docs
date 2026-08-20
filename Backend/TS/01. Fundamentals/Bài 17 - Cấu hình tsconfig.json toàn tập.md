## I. KHÁI QUÁT (OVERVIEW)

Mọi dự án sử dụng TypeScript đều được quản lý bởi một tệp cấu hình cốt lõi mang tên **`tsconfig.json`** nằm ở thư mục gốc. Tệp tin này đóng vai trò quyết định đối với hành vi của Trình biên dịch TypeScript (TSC):
1.  Xác định danh sách các tệp tin nào sẽ được đưa vào quá trình biên dịch.
2.  Chỉ định các tùy chọn biên dịch (Compiler Options) để chuyển đổi mã nguồn TypeScript (`.ts`) thành mã nguồn JavaScript (`.js`) tương thích với môi trường chạy thực tế (Node.js hoặc trình duyệt).
3.  Thiết lập mức độ nghiêm ngặt (Strictness) khi kiểm tra kiểu dữ liệu để phát hiện lỗi sớm.

Hiểu sâu sắc các thông số cấu hình trong `tsconfig.json` là điều kiện bắt buộc để một lập trình viên Backend có thể tự thiết lập, tối ưu hiệu năng build và quản lý cấu trúc thư mục của một dự án lớn từ đầu.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

Dưới đây là một tệp `tsconfig.json` chuẩn doanh nghiệp dành cho dự án Backend Node.js, đi kèm giải thích cặn kẽ từng thông số cấu hình cốt lõi:

```json
{
  "compilerOptions": {
    /* 1. Môi trường Đích & Thư viện (Target & Lib) */
    "target": "ES2022",                          // Phiên bản JavaScript đầu ra (ES2022 hỗ trợ hầu hết tính năng Node.js hiện đại)
    "lib": ["ES2022"],                           // Định nghĩa các thư viện API có sẵn ở môi trường chạy (ví dụ: Map, Promise)

    /* 2. Cấu trúc thư mục Đầu vào/Đầu ra (Emit) */
    "outDir": "./dist",                          // Thư mục chứa mã nguồn JavaScript đầu ra sau khi build
    "rootDir": "./src",                          // Thư mục gốc chứa toàn bộ mã nguồn TypeScript đầu vào
    "removeComments": true,                      // Tự động xóa các ghi chú (comments) khỏi file JS đầu ra để giảm kích thước tệp

    /* 3. Kiểm soát Module & Import (Module Resolution) */
    "module": "CommonJS",                        // Hệ thống module đầu ra (NodeJS truyền thống dùng CommonJS, NestJS dùng CommonJS)
    "moduleResolution": "Node",                  // Thuật toán tìm kiếm module (bắt chước cơ chế tìm kiếm node_modules của Node)
    "esModuleInterop": true,                     // Cho phép import các module CommonJS bằng cú pháp ES Module chuẩn
    "forceConsistentCasingInFileNames": true,    // Bắt buộc viết hoa/thường tên file đồng nhất (tránh lỗi build chéo hệ điều hành Linux/Windows)

    /* 4. Thiết lập Kiểm tra kiểu Nghiêm ngặt (Strict Checks) */
    "strict": true,                              // Bật TOÀN BỘ các tùy chọn kiểm tra kiểu nghiêm ngặt (Quy tắc vàng bắt buộc)
    "noImplicitAny": true,                       // Báo lỗi nếu một biến không được khai báo kiểu dữ liệu và tự động suy luận thành 'any'
    "strictNullChecks": true,                    // Báo lỗi nếu gán null/undefined cho kiểu dữ liệu không cho phép
    "strictBindCallApply": true,                 // Kiểm tra kiểu tham số chặt chẽ khi gọi các hàm bind, call, apply

    /* 5. Tối ưu hóa & Dọn dẹp (Linter-like Rules) */
    "noUnusedLocals": true,                      // Báo lỗi nếu khai báo biến cục bộ nhưng không sử dụng
    "noUnusedParameters": true,                  // Báo lỗi nếu khai báo tham số hàm nhưng không sử dụng
    "noImplicitReturns": true,                   // Báo lỗi nếu một hàm có return ở một nhánh nhưng lại không return ở nhánh khác
    "skipLibCheck": true                         // Bỏ qua kiểm tra kiểu trong các file định nghĩa kiểu ở node_modules (tăng tốc độ build)
  },
  "include": ["src/**/*"],                       // Chỉ định các thư mục sẽ được biên dịch
  "exclude": ["node_modules", "dist", "**/*.spec.ts"] // Loại trừ các thư mục không cần biên dịch (thư mục build, thư mục test)
}
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Phân tích tác động của `strictNullChecks`
Tùy chọn `"strictNullChecks": true` (nằm trong nhóm `"strict": true`) thay đổi hoàn toàn cách TypeScript đối xử với `null` và `undefined`.

```typescript
// Khi "strictNullChecks": false (Rất nguy hiểm)
let username: string;
username = null; // ✅ Trôi qua biên dịch, nhưng có thể gây lỗi crash runtime khi gọi username.trim()

// Khi "strictNullChecks": true (An toàn tuyệt đối)
let usernameSafe: string;
// usernameSafe = null; // ❌ Lỗi biên dịch: Type 'null' is not assignable to type 'string'

// Bắt buộc phải khai báo Union Type nếu muốn chấp nhận null
let usernameUnion: string | null = null; // ✅ Hợp lệ
```

### 2. Phân tích tác động của `noImplicitAny`
Tùy chọn này ngăn chặn việc lười biếng bỏ qua kiểu dữ liệu của tham số hàm, đảm bảo mã nguồn luôn được kiểm soát kiểu chặt chẽ.

```typescript
// Khi "noImplicitAny": false
function logMessage(msg) { // ✅ Trôi qua, msg tự động nhận kiểu 'any' (mất an toàn kiểu)
  console.log(msg.toLowerCase());
}

// Khi "noImplicitAny": true
function logMessageStrict(msg) { // ❌ Lỗi biên dịch: Parameter 'msg' implicitly has an 'any' type.
  console.log(msg);
}
// Sửa đúng:
function logMessageCorrect(msg: string) { // ✅ Hợp lệ
  console.log(msg);
}
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & CORE RULES)

### 1. Cạm bẫy Module Resolution trên Production
Khi thiết lập dự án Node.js lớn, chúng ta thường cấu hình **Path Mapping (Alias Imports)** để viết code ngắn gọn hơn:
```json
"paths": {
  "@services/*": ["src/services/*"]
}
```
Và viết code import dạng: `import { UserService } from '@services/user.service';`

> [!WARNING]
> **Cạm bẫy:** TypeScript Compiler (`tsc`) chỉ thực hiện kiểm tra kiểu và dịch file `.ts` sang `.js`, nó **không hề thay đổi đường dẫn** `@services/...` thành đường dẫn tương đối ở file JavaScript đầu ra. 
> Khi chạy code trên production bằng lệnh `node dist/index.js`, Node.js sẽ bị sập vì không hiểu đường dẫn `@services`.
> 
> **Giải pháp:** Phải sử dụng thêm các thư viện runtime resolver ở production như `tsconfig-paths` hoặc dùng bundler (Webpack, Esbuild) để đóng gói và biên dịch lại đường dẫn thực tế.

---

## 💡 5 QUY TẮC VÀNG KHI CẤU HÌNH TSCONFIG
1.  **Luôn bật `"strict": true`:** Đây là quy tắc vàng không thể thỏa hiệp trong mọi dự án TypeScript. Tắt strict mode sẽ làm giảm 80% sức mạnh bảo vệ kiểu của TypeScript.
2.  **Đặt `"skipLibCheck": true`:** Giúp trình biên dịch không tốn thời gian kiểm tra kiểu của hàng nghìn file `.d.ts` bên trong thư mục `node_modules`, tăng tốc độ build dự án lên gấp 2 - 3 lần.
3.  **Tách biệt tệp cấu hình cho Development và Production:** Sử dụng thuộc tính `"extends"` để kế thừa cấu hình chung, ví dụ `tsconfig.prod.json` kế thừa từ `tsconfig.json` gốc nhưng loại trừ (exclude) các file test.
4.  **Cấu hình rootDir và outDir rõ ràng:** Luôn gom code TypeScript vào thư mục đầu vào `./src` và xuất code JavaScript đầu ra vào `./dist` để cấu trúc dự án sạch sẽ.
5.  **Luôn bật `"forceConsistentCasingInFileNames": true`:** Đảm bảo dự án của bạn khi build trên Windows (hệ điều hành không phân biệt chữ hoa/thường) sẽ không bị lỗi khi deploy lên server Docker/Linux (hệ điều hành phân biệt cực kỳ nghiêm ngặt chữ hoa/thường tên file). Alo bài tập compile sẽ luôn an toàn.
