## 1. Vấn đề lỗ hổng kiểu khi sử dụng Object Union thông thường
Khi làm việc với các Union Type dạng đối tượng, ví dụ:
```typescript
interface Circle {
  radius: number;
}
interface Square {
  sideLength: number;
}

type Shape = Circle | Square;
```

Dựa trên nguyên lý **Structural Typing** của TypeScript, một đối tượng chỉ cần thỏa mãn tối thiểu các thuộc tính bắt buộc của một trong hai kiểu là đã được coi là hợp lệ.

Điều này dẫn đến một cạm bẫy cực kỳ nguy hiểm: **Bạn có thể tạo ra một đối tượng "lai" chứa các thuộc tính của cả hai kiểu** mà TypeScript vẫn không báo lỗi:

```typescript
// Đối tượng này vừa có radius vừa có sideLength
const hybridShape = {
  radius: 10,
  sideLength: 5
};

// ✅ Hoàn toàn hợp lệ! TypeScript chấp nhận gán hybridShape cho Shape 
// vì nó thỏa mãn tối thiểu cấu trúc của Circle.
const myShape: Shape = hybridShape; 
```
*Hệ quả:* Dữ liệu bị rác, các thuộc tính của nhánh này bị tràn (bleed) sang nhánh khác, gây khó khăn khi debug và xử lý logic thực tế ở runtime.

Để giải quyết vấn đề này, các chuyên gia TypeScript sử dụng kỹ thuật **Strict Union Types (Kiểu kết hợp nghiêm ngặt)**.

---

## 2. Kỹ thuật Strict Union Types là gì?
Ý tưởng cốt lõi của **Strict Union Types** là: **Chủ động cấm các thuộc tính độc nhất của đối tượng này xuất hiện trong đối tượng kia** bằng cách khai báo chúng là các thuộc tính tùy chọn (`?`) có kiểu dữ liệu là **`never`**.

### Cách triển khai nâng cao:
Chúng ta viết lại cấu trúc của `Circle` và `Square` như sau:

```typescript
type StrictCircle = {
  radius: number;
  sideLength?: never; // Khẳng định: Nếu là Circle thì KHÔNG ĐƯỢC PHÉP chứa thuộc tính sideLength
};

type StrictSquare = {
  sideLength: number;
  radius?: never;     // Khẳng định: Nếu là Square thì KHÔNG ĐƯỢC PHÉP chứa thuộc tính radius
};

type StrictShape = StrictCircle | StrictSquare;
```

### Kết quả kiểm tra kiểu:
```typescript
// 1. Chỉ truyền radius -> ✅ Hợp lệ
const c: StrictShape = { radius: 10 };

// 2. Chỉ truyền sideLength -> ✅ Hợp lệ
const s: StrictShape = { sideLength: 5 };

// 3. Truyền cả hai thuộc tính -> ❌ Báo lỗi compile ngay lập tức!
const hybrid: StrictShape = {
  radius: 10,
  sideLength: 5
};
// Lỗi: Type '{ radius: number; sideLength: number; }' is not assignable to type 'StrictShape'.
// Type '{ radius: number; sideLength: number; }' is not assignable to type 'StrictCircle'.
// Types of property 'sideLength' are incompatible. Type 'number' is not assignable to type 'undefined'.
```

---

## 3. Tại sao kiểu `never` kết hợp với `?` lại hoạt động?
Khi bạn định nghĩa `sideLength?: never`, TypeScript sẽ hiểu thuộc tính `sideLength` có kiểu là `never | undefined`.
* Vì kiểu `never` đại diện cho giá trị không thể xảy ra, giá trị duy nhất bạn có thể gán cho thuộc tính này chỉ là `undefined` (hoặc hoàn toàn không khai báo thuộc tính đó).
* Nếu bạn cố tình gán một con số (`number`) hay chuỗi (`string`) vào thuộc tính đó, trình biên dịch sẽ báo lỗi bất tương thích ngay lập tức.

Đây là một kỹ thuật nâng cao cực kỳ hiệu quả giúp bạn giữ sạch cấu trúc dữ liệu của các API Request, DTOs (Data Transfer Objects) trong các ứng dụng Backend như NestJS.
