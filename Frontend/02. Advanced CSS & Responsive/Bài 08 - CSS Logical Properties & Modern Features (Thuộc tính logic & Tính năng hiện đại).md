## I. KHÁI QUÁT

CSS đã phát triển vượt bậc trong vài năm qua. Các kỹ thuật cũ dần nhường chỗ cho các hàm toán học tích hợp (clamp), các thuộc tính logic tương thích với mọi hướng viết chữ (LTR, RTL), và các Selector cực kỳ mạnh mẽ mà trước đây ta buộc phải dùng JavaScript mới làm được (như `:has`).

> [!IMPORTANT]
> Hiểu và áp dụng các tính năng mới này giúp giảm đáng kể lượng code CSS, loại bỏ JavaScript rườm rà và giúp website tự động tương thích với môi trường quốc tế hóa (i18n).

## II. CHI TIẾT KỸ THUẬT VÀ TÍNH NĂNG MỚI

### 1. Hàm Toán Học (Math Functions): `clamp()`, `min()`, `max()`

Thay vì phải dùng Media Queries để thay đổi font-size ở từng breakpoint, ta dùng hàm CSS.

- `min(val1, val2)`: Luôn chọn giá trị nhỏ hơn.
- `max(val1, val2)`: Luôn chọn giá trị lớn hơn.
- `clamp(MIN, PREFERRED, MAX)`: Cực kỳ hữu ích. Nó giống như giá trị đàn hồi: Nó sẽ dùng giá trị ƯU TIÊN, miễn là giá trị ưu tiên đó không nhỏ hơn MIN và không lớn hơn MAX.

```css
/* Responsive Typography cực mạnh */
h1 {
  /* 
    Font chữ sẽ cố gắng chiếm 5% chiều rộng màn hình (5vw).
    Nhưng không bao giờ nhỏ hơn 1.5rem (trên mobile nhỏ)
    Và không bao giờ lớn hơn 4rem (trên màn hình tivi rộng)
  */
  font-size: clamp(1.5rem, 5vw, 4rem);
}
```

### 2. Thuộc tính logic (Logical Properties)

Bao lâu nay ta dùng `margin-left`, `padding-top`. Điều này là "Cứng" (Physical). Nếu bạn thiết kế một web và dịch sang tiếng Ả Rập (viết từ Phải sang Trái - RTL), mọi `margin-left` sẽ bị sai.

Logical Properties dựa trên **Trục Khối (Block - Chiều dọc/Trục Y)** và **Trục Hàng (Inline - Chiều ngang/Trục X)** của văn bản.

| Thuộc tính Cũ (Vật lý) | Thuộc tính Logic (Tương ứng với LTR - Anh/Việt) |
|------------------------|-------------------------------------------------|
| `margin-top`           | `margin-block-start`                            |
| `margin-bottom`        | `margin-block-end`                              |
| `margin-left`          | `margin-inline-start`                           |
| `margin-right`         | `margin-inline-end`                             |
| `width`                | `inline-size`                                   |
| `height`               | `block-size`                                    |

```css
.card {
  padding-inline: 20px; /* Tương đương padding-left & right: 20px */
  margin-block: 10px;   /* Tương đương margin-top & bottom: 10px */
  border-inline-start: 4px solid blue; /* Tương đương border-left cho LTR, border-right cho RTL */
}
```

### 3. Parent Selector: `:has()` (Cuộc Cách Mạng)

Suốt nhiều thập kỷ, CSS không thể chọn được phần tử cha dựa trên sự tồn tại của phần tử con. Ví dụ: "Nếu thẻ `<a>` có chứa thẻ `<img>`, hãy bỏ gạch chân của thẻ `<a>`". Giờ thì `:has()` đã biến điều này thành sự thật.

```css
/* Chỉ style cho figure NẾU nó chứa một figcaption */
figure:has(figcaption) {
  background: #f0f0f0;
  padding: 10px;
}

/* Ứng dụng: Form Label Highlight 
   Nếu input lân cận bị check, đổi màu label nằm trước nó */
label:has(+ input[type="radio"]:checked) {
  font-weight: bold;
  color: blue;
}
```

### 4. Cascade Layers: `@layer`

Giải quyết hoàn toàn vấn đề Specificity (độ ưu tiên của rule). Đôi khi một thư viện CSS ngoài (như Bootstrap) có rule `!important` làm bạn không thể ghi đè. Lớp `@layer` cho phép bạn định nghĩa thứ tự ưu tiên của toàn bộ khối CSS. Lớp được khai báo sau sẽ ghi đè lớp trước, bất kể specificity của selector bên trong.

```css
/* Khai báo thứ tự lớp (từ thấp đến cao) */
@layer reset, framework, custom;

@layer framework {
  /* Rule của framework, tính đặc trưng rất cao */
  body#app .container div.box {
    background-color: red; 
  }
}

@layer custom {
  /* Rule của bạn, tính đặc trưng rất thấp (chỉ là class) */
  .box {
    background-color: blue; 
  }
}

/* Kết quả: Box sẽ có màu blue, vì lớp "custom" đứng sau "framework" */
```

## III. VÍ DỤ MINH HỌA

### Interactive Form Validation với `:has()`

Tạo trải nghiệm UI form mượt mà không cần JS.

```html
<div class="form-group">
  <input type="email" placeholder="Nhập email" required class="input">
  <span class="error-icon">❌</span>
</div>
```

```css
.form-group {
  position: relative;
  display: inline-block;
}
.error-icon { display: none; }

/* Nếu thẻ input trong form-group này không hợp lệ và đã được focus */
.form-group:has(input:invalid:focus) .error-icon {
  display: inline;
  color: red;
  position: absolute;
  right: 10px;
}

/* Đổi viền input nếu hợp lệ (valid) */
.form-group:has(input:valid) input {
  border-color: green;
}
```

## IV. LƯU Ý CẠM BẪY

> [!WARNING]
> Mặc dù `clamp()`, `min()`, `max()` được hỗ trợ rộng rãi, các hàm này không hoạt động tốt bên trong các thuộc tính tính toán thời gian thực phức tạp của SVG cũ. 

> [!TIP]
> `:has()` tuy vô cùng mạnh mẽ nhưng được coi là tốn tài nguyên trình duyệt hơn các selector thông thường (vì trình duyệt phải đánh giá toàn bộ các phần tử con để quyết định hiển thị phần tử cha). Dù engine hiện đại tối ưu tốt, nhưng hạn chế dùng `:has(*)` ở gốc DOM.

> [!CAUTION]
> Khi sử dụng Logical Properties (`margin-inline-start`), hãy đảm bảo trình duyệt mục tiêu (Target Browsers) của dự án có mức độ hiện đại phù hợp. Apple Safari có lịch sử hỗ trợ khá chậm so với Chrome/Firefox ở các tính năng này (thường cần iOS 14.5+ cho đầy đủ các thuộc tính logic phức tạp).
