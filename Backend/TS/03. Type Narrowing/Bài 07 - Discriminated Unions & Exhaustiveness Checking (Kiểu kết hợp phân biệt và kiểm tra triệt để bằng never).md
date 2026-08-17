## 1. Discriminated Unions (Kiểu kết hợp phân biệt) là gì?
Khi thiết kế các hệ thống phức tạp, bạn thường phải định nghĩa các đối tượng có cấu trúc khác nhau dựa trên một phân loại cụ thể (ví dụ: các loại hình học, các trạng thái của một Request API, các loại thông báo hệ thống...).

**Discriminated Unions** (hoặc Tagged Unions) là một mô hình thiết kế tối quan trọng trong TypeScript. Nó được tạo ra khi các đối tượng trong một Union Type sở hữu **chung một thuộc tính có kiểu Literal** đóng vai trò làm **nhãn phân biệt (tag/discriminant)**.

### Ví dụ thực tế:
Chúng ta có 3 hình: Circle, Square, và Rectangle. Chúng có chung thuộc tính `kind` dùng để phân biệt loại hình học:

```typescript
interface Circle {
  kind: "circle"; // Nhãn phân biệt (Literal Type)
  radius: number;
}

interface Square {
  kind: "square"; // Nhãn phân biệt
  sideLength: number;
}

interface Rectangle {
  kind: "rectangle"; // Nhãn phân biệt
  width: number;
  height: number;
}

// Tạo Union Type
type Shape = Circle | Square | Rectangle;
```

---

## 2. Cách thu hẹp kiểu bằng Nhãn Phân Biệt

Khi bạn sử dụng cấu trúc `switch-case` hoặc `if-else` để kiểm tra thuộc tính nhãn (`kind`), TypeScript sẽ tự động thu hẹp kiểu của đối tượng về đúng hình dạng tương ứng một cách hoàn hảo:

```typescript
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // shape chắc chắn là Circle
      return Math.PI * shape.radius ** 2;
    case "square":
      // shape chắc chắn là Square
      return shape.sideLength ** 2;
    case "rectangle":
      // shape chắc chắn là Rectangle
      return shape.width * shape.height;
  }
}
```

---

## 3. Kiến thức nâng cao cực hạn: Exhaustiveness Checking với kiểu `never`

Hãy tưởng tượng một ngày dự án của bạn phình to ra, và một lập trình viên khác thêm một hình mới vào Union Type `Shape` nhưng quên không cập nhật logic tính diện tích trong hàm `getArea`.

```typescript
interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

// Thêm Triangle vào Shape
type Shape = Circle | Square | Rectangle | Triangle;
```
Lúc này, hàm `getArea` ở trên vẫn compile bình thường nhưng sẽ trả về `undefined` ở runtime khi gặp hình `Triangle`. Đây là một lỗ hổng an toàn kiểu cực kỳ nguy hiểm.

Để giải quyết triệt để, chúng ta sử dụng kỹ thuật **Exhaustiveness Checking (Kiểm tra tính triệt để)** bằng cách gán giá trị thừa vào kiểu **`never`** ở nhánh `default`:

```typescript
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.sideLength ** 2;
    case "rectangle":
      return shape.width * shape.height;
    
    // case "triangle":
    //   return (shape.base * shape.height) / 2;
      
    default:
      // Kỹ thuật Exhaustiveness Checking
      // Nếu tất cả các case ở trên đã bao phủ hết mọi khả năng của Shape, 
      // thì biến 'shape' rơi xuống nhánh default bắt buộc phải có kiểu 'never'.
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

### Điều gì xảy ra khi có lỗi?
Nếu bạn quên handle case `"triangle"`, biến `shape` khi rơi xuống nhánh `default` sẽ có kiểu dữ liệu thực tế là `Triangle`. 

Khi đó, dòng code `const _exhaustiveCheck: never = shape;` sẽ **bị báo lỗi đỏ ngay khi compile**:
> ❌ *Lỗi compile: Type 'Triangle' is not assignable to type 'never'.*

Lập trình viên sẽ bị ép buộc phải code thêm case `"triangle"` để sửa lỗi compile, giúp chương trình luôn luôn an toàn 100% khi chạy thực tế!
