# Bài 07 - Sass & PostCSS (Bộ tiền xử lý & Hậu xử lý CSS)

## I. KHÁI QUÁT

CSS thuần túy (Vanilla CSS) rất tuyệt, nhưng khi dự án lớn, nó bộc lộ giới hạn: không có hàm, không có vòng lặp, thiếu khả năng chia nhỏ file hiệu quả. Để khắc phục, công cụ CSS được chia thành 2 loại mạnh mẽ:

1. **Bộ tiền xử lý (Pre-processors - SASS/SCSS, LESS, Stylus)**: Cung cấp cú pháp ngôn ngữ mạnh mẽ như lập trình (biến, vòng lặp, hàm), sau đó "biên dịch" mã đó thành CSS thuần để trình duyệt hiểu. SCSS là ngôn ngữ thống trị thị trường.
2. **Bộ hậu xử lý (Post-processors - PostCSS)**: Nhận CSS thuần (hoặc CSS đã biên dịch từ SCSS) làm đầu vào, dùng các plugin (được viết bằng JavaScript) để biến đổi CSS (ví dụ: tự động thêm tiền tố trình duyệt, minifier).

> [!IMPORTANT]
> Sass/SCSS mở rộng tính năng của CSS trước khi biên dịch. PostCSS biến đổi và tối ưu CSS sau khi biên dịch. Trong quy trình làm việc hiện đại, chúng thường được kết hợp cùng nhau.

## II. CHI TIẾT KỸ THUẬT (SASS/SCSS)

Sass có 2 cú pháp: `.sass` (dùng thụt lề, không dấu ngoặc) và `.scss` (Sassy CSS, sử dụng cú pháp giống hệt CSS thuần). `.scss` được sử dụng rộng rãi nhất.

### 1. Variables (Biến)

Dù CSS thuần hiện nay đã có Custom Properties (CSS Variables: `--var`), biến SCSS (bắt đầu bằng `$`) vẫn hữu ích khi biên dịch và không làm nặng DOM.

```scss
$primary-color: #3498db;
$text-color: #333;
$font-stack: 'Helvetica Neue', sans-serif;

body {
  font: 100% $font-stack;
  color: $text-color;
  background-color: lighten($primary-color, 40%); /* Sử dụng hàm tích hợp */
}
```

### 2. Nesting (Lồng ghép)

Cho phép viết CSS theo cấu trúc thứ bậc, bắt chước cấu trúc HTML. Cực kỳ mạnh mẽ khi dùng kết hợp với BEM. Ký tự `&` được dùng để tham chiếu đến Selector cha.

```scss
.nav {
  list-style: none;
  
  li {
    display: inline-block;
  }
  
  a {
    text-decoration: none;
    color: $text-color;
    
    &:hover {
      color: $primary-color; /* & sẽ dịch thành .nav a:hover */
    }
  }
}

/* Áp dụng vào BEM */
.card {
  background: white;

  &__title { font-size: 20px; } /* Dịch thành .card__title */
  &--active { border-color: red; } /* Dịch thành .card--active */
}
```

### 3. Mixins & Includes (Hàm tái sử dụng)

Mixins giúp định nghĩa các khối CSS có thể được sử dụng lại ở nhiều nơi. Nó có thể nhận tham số truyền vào như một hàm trong lập trình.

```scss
@mixin flex-center($direction: row) {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: $direction;
}

.box {
  @include flex-center(); /* Dùng mặc định là row */
  width: 100px; height: 100px;
}

.sidebar {
  @include flex-center(column); /* Truyền tham số column */
}
```

### 4. Modules: `@use` vs `@import`

Trước đây Sass dùng `@import` để nối file. Hiện nay `@import` đã bị deprecated vì gây ra biến toàn cục khó kiểm soát. Cách mới là dùng `@use`.

```scss
/* Trong _variables.scss */
$primary: #e74c3c;

/* Trong style.scss */
@use 'variables' as var; /* Tải dưới dạng namespace */

.btn {
  background-color: var.$primary;
}
```

## III. VÍ DỤ MINH HỌA: VÒNG LẶP SASS ĐỂ TẠO GRID/UTILITIES

Sass có các vòng lặp `@for`, `@each` giúp tạo ra các class tiện ích (utility classes) một cách tự động, giống như cách Bootstrap hay Tailwind được xây dựng.

```scss
/* Tạo ra vòng lặp sinh các class m-1, m-2, m-3 ... */
$spacing-unit: 8px;

@for $i from 1 through 5 {
  .m-#{$i} {
    margin: $i * $spacing-unit;
  }
  .mt-#{$i} {
    margin-top: $i * $spacing-unit;
  }
}

/* Vòng lặp lấy giá trị từ một Map (như Object/Dictionary) */
$theme-colors: (
  "primary": #007bff,
  "success": #28a745,
  "danger": #dc3545
);

@each $name, $color in $theme-colors {
  .btn-#{$name} {
    background-color: $color;
    border: 1px solid darken($color, 10%);
  }
  .text-#{$name} {
    color: $color;
  }
}
```

## IV. LƯU Ý CẠM BẪY

> [!WARNING]
> **Hiệu ứng Inception (Lồng nhau quá sâu)**: Đừng lồng quá 3 cấp trong SCSS. Nó sẽ tạo ra CSS cực kỳ đặc thù (high specificity) rất khó ghi đè và làm phình kích thước file CSS cuối cùng.
> VD: `.main .content ul li a { ... }` là một thảm họa về hiệu năng và bảo trì. Hãy dùng các class nông (như BEM).

> [!TIP]
> **PostCSS là công cụ không thể thiếu**: Ngay cả khi bạn viết CSS thuần, bạn vẫn nên dùng PostCSS với plugin `Autoprefixer`. Plugin này sẽ quét file CSS của bạn, tra cứu thư viện CanIUse, và tự động thêm các prefix như `-webkit-`, `-moz-` vào các thuộc tính CSS mới cần thiết cho các trình duyệt cũ, để bạn không bao giờ phải gõ chúng bằng tay.

> [!CAUTION]
> **Phân biệt Biến SCSS (`$var`) và Biến CSS (`--var`)**: 
> - Biến SCSS được biên dịch tĩnh một lần. Bạn không thể dùng Javascript để đổi màu biến SCSS khi chạy.
> - Biến CSS là động, được trình duyệt tính toán lúc chạy (runtime), có thể đổi dễ dàng qua Javascript (rất tốt để làm Theme Tối/Sáng).
> - Hiện tại, người ta khuyên nên kết hợp: Dùng SCSS cho mixin/vòng lặp, nhưng quản lý Màu sắc/Typography bằng CSS Variables để dễ tương tác JS.
