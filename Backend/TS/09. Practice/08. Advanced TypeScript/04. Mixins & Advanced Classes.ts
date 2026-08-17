// Bài tập 04: Mixins & Advanced Classes
// Yêu cầu: Triển khai trộn tính năng (Mixins) và sử dụng Parameter Properties trong Class.

// 1. Tạo Mixin:
type Constructor = new (...args: any[]) => {};

// Hãy viết một hàm Mixin `Serializable<TBase extends Constructor>` bổ sung phương thức:
// - toJSON(): string (trả về chuỗi JSON.stringify(this))
function Serializable(Base) {
  // Hoàn thành Class trả về ở đây
  return class extends Base {};
}


// 2. Sử dụng Parameter Properties:
// Hãy định nghĩa một Class `ProductService` sử dụng tính năng Parameter Properties 
// để khai báo nhanh hai thuộc tính trong constructor:
// - `dbUrl` (private, string)
// - `timeout` (public, readonly, number)
class ProductService {
  // Định nghĩa constructor ngắn gọn ở đây
}
