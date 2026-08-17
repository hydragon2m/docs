## 1. Ambient Declarations là gì? (Từ khóa `declare`)
Khi viết ứng dụng Node.js, đôi khi bạn cần gọi các biến toàn cục được đưa vào từ runtime hoặc các thư viện JavaScript bên ngoài mà không có định nghĩa kiểu (ví dụ: đối tượng `window` trong trình duyệt, biến toàn cục `process.env` của Node.js, hoặc đối tượng `__DEV__`).

Nếu không khai báo, TypeScript sẽ báo lỗi biên dịch vì không tìm thấy tên biến. Từ khóa **`declare`** được dùng để khai báo cho TypeScript biết: *"Biến này đã tồn tại ở môi trường runtime rồi, hãy tin tôi và cho phép biên dịch qua"*.

Các file chỉ chứa khai báo kiểu dữ liệu như vậy có phần mở rộng là **`.d.ts`** (Declaration Files).

---

## 2. Ứng dụng nâng cao thực tế: Mở rộng kiểu cho Express Request

Trong lập trình Backend Node.js với Express/NestJS, bạn thường viết Middleware để giải mã JWT Token và gán thông tin `user` vào đối tượng `Request` của Express.

Tuy nhiên, đối tượng `Request` mặc định của thư viện Express **không chứa thuộc tính `user`**, dẫn đến việc TypeScript báo lỗi đỏ khi bạn gán: `req.user = decodedUser`.

### Giải pháp: Sử dụng Declaration Merging để mở rộng kiểu của Express
Chúng ta tạo một file khai báo kiểu, ví dụ: `src/@types/express.d.ts`:

```typescript
// Báo cho TS biết chúng ta muốn can thiệp vào module 'express'
declare namespace Express {
  // Gộp khai báo thêm thuộc tính 'user' vào Interface Request có sẵn của Express
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
    };
  }
}
```
*Lưu ý:* TypeScript sẽ tự động tìm kiếm các file `.d.ts` trong dự án của bạn (hoặc theo cấu hình `typeRoots` trong `tsconfig.json`) và thực hiện **Declaration Merging (Gộp khai báo)** interface `Request` toàn cục. Nhờ đó, bạn có thể gọi `req.user.role` ở bất cứ đâu trong dự án mà không bị báo lỗi.

---

## 3. Ambient Modules (Định nghĩa kiểu cho thư viện JS không có type)
Nếu bạn cài đặt một thư viện cũ từ npm không có kiểu dữ liệu TypeScript (và không có package `@types/...`), TypeScript sẽ báo lỗi khi bạn `import` thư viện đó.

Bạn có thể viết một Ambient Module đè lên để thông báo cho TypeScript bỏ qua kiểm tra thư viện này:

Tạo file `declarations.d.ts`:
```typescript
// Chấp nhận tất cả các import từ thư viện 'legacy-js-lib' và coi nó là kiểu 'any'
declare module "legacy-js-lib";
```
Sau đó, bạn có thể import và dùng bình thường mà không bị báo lỗi đỏ:
```typescript
import { someFunc } from "legacy-js-lib"; // ✅ Hợp lệ
```
