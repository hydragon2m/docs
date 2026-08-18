// Bài tập 01: Decorators (Trình trang trí)
// Yêu cầu: Định nghĩa Class hoặc Method Decorator để biến đổi cấu trúc.

// 1. Viết Class Decorator `@FreezeClass`:
// Sử dụng phương thức `Object.freeze` để đóng băng lớp constructor và prototype của nó
// khiến cho không ai có thể thêm mới hoặc chỉnh sửa thuộc tính của Class ở runtime.
function FreezeClass(constructor: Function) {
  Object.freeze(constructor);
  Object.freeze(constructor.prototype);
}

@FreezeClass
class ConfigService {
  appName: string = "MyApp";
}

// 2. Viết Method Decorator `@CheckRole`:
// Giả lập một Decorator nhận vào danh sách các role hợp lệ, ví dụ `@CheckRole(["admin"])`.
// Nếu người dùng gọi phương thức đó mà không thuộc role hợp lệ, ném ra lỗi (throw new Error("Unauthorized")).
// Gợi ý: viết Decorator Factory trả về Method Decorator, kiểm tra giá trị của biến giả lập `currentUserRole`.

const currentUserRole = "user"; // Có thể đổi thành "admin" để test

function CheckRole(allowedRoles: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      // Thực hiện kiểm tra currentUserRole nằm trong allowedRoles trước khi chạy originalMethod
      return originalMethod.apply(this, args);
    };
  };
}
