// Bài tập 05: Template Literal Types & Utility Combinations
// Yêu cầu: Tổ hợp các tính năng nâng cao để thiết kế kiểu dữ liệu động.

// 1. Dùng Template Literal tổ hợp:
type Horizontal = "left" | "right";
type Vertical = "top" | "bottom";
// Hãy tạo một kiểu `Quadrant` tổ hợp 4 góc phần tư dạng: "top-left" | "top-right" | "bottom-left" | "bottom-right".
type Quadrant = any; // Sửa lại dòng này


// 2. Lọc thuộc tính đối tượng bằng `as never`:
interface IPost {
  id: number;
  title: string;
  content: string;
  likeCount: number;
  isPublished: boolean;
}

// Hãy viết kiểu `PickOnlyNumbers<T>` tự động lọc ra và chỉ giữ lại các thuộc tính có kiểu là `number` của T.
type PickOnlyNumbers<T> = any; // Sửa lại dòng này
type PostNumbers = PickOnlyNumbers<IPost>;
// PostNumbers tương đương: { id: number; likeCount: number }
