# Bài 04 - Responsive Web Design & Media Queries (Thiết kế đáp ứng)

## I. KHÁI QUÁT

Responsive Web Design (RWD - Thiết kế web đáp ứng) là phương pháp thiết kế và phát triển web sao cho giao diện và nội dung tự động điều chỉnh, hiển thị đẹp mắt và thân thiện trên mọi thiết bị, từ màn hình điện thoại di động nhỏ bé, máy tính bảng, đến màn hình desktop lớn.

Thành phần cốt lõi của RWD bao gồm:
1.  **Fluid Grids (Lưới linh hoạt)**: Sử dụng các đơn vị tương đối (như %, vw, vh, fr) thay vì đơn vị tuyệt đối (px) cho kích thước khối.
2.  **Flexible Images (Hình ảnh linh hoạt)**: Kích thước ảnh thay đổi theo kích thước của khối chứa nó (thường sử dụng `max-width: 100%`).
3.  **Media Queries (Truy vấn phương tiện)**: Cơ chế của CSS cho phép áp dụng các khối lệnh CSS khác nhau dựa trên các đặc điểm của thiết bị (độ phân giải, chiều rộng, hướng xoay màn hình).

> [!IMPORTANT]
> Triết lý thiết kế hiện đại nhất là **Mobile-First (Ưu tiên thiết bị di động)**. Bạn viết CSS mặc định cho thiết bị di động, sau đó sử dụng `min-width` media queries để thêm các quy tắc cho màn hình lớn hơn.

## II. CHI TIẾT KỸ THUẬT

### 1. Viewport Meta Tag

Quy tắc bắt buộc đầu tiên để RWD hoạt động trên di động là thẻ meta viewport trong file HTML. Không có thẻ này, thiết bị di động sẽ hiển thị trang web như trên desktop nhưng thu nhỏ lại, khiến văn bản không thể đọc được.

```html
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
```

### 2. Cú pháp Media Queries

Cú pháp chuẩn sử dụng `@media`:

```css
/* CSS mặc định ở đây (Thường là cho mobile theo triết lý Mobile-First) */
body {
  font-size: 16px;
}

/* Dành cho màn hình từ 768px trở lên (Tablet) */
@media (min-width: 768px) {
  body {
    font-size: 18px;
  }
}

/* Dành cho màn hình từ 1024px trở lên (Desktop) */
@media (min-width: 1024px) {
  body {
    font-size: 20px;
  }
}
```

#### Các toán tử trong Media Queries
- `and`: Kết hợp nhiều điều kiện. VD: `@media (min-width: 600px) and (max-width: 900px)`
- `not`: Phủ định một truy vấn. VD: `@media not all and (min-width: 600px)`
- `,` (dấu phẩy): Đóng vai trò như toán tử OR. VD: `@media (min-width: 1000px), (orientation: landscape)`

#### Media Features (Các tính năng kiểm tra thường dùng)
- `width` / `min-width` / `max-width`: Chiều rộng viewport.
- `height` / `min-height` / `max-height`: Chiều cao viewport.
- `orientation: portrait` (Dọc) hoặc `landscape` (Ngang).
- `prefers-color-scheme: dark` / `light`: Kiểm tra xem thiết bị đang ở chế độ giao diện Sáng hay Tối.

### 3. Container Queries (Truy vấn Container - Tính năng mới đột phá)

Trước đây, Media Queries chỉ có thể đo đạc dựa trên **toàn bộ viewport (cửa sổ trình duyệt)**. Điều này gây khó khăn khi bạn thiết kế một Component (ví dụ: Card) có thể được đặt ở bất kỳ đâu (trong Sidebar hẹp hoặc vùng Main rộng).

**Container Queries** (`@container`) cho phép component tự phản ứng dựa trên kích thước của container trực tiếp chứa nó, không phải kích thước của viewport.

```css
/* Bước 1: Định nghĩa một khối chứa (container) và đặt tên cho nó (tùy chọn) */
.card-container {
  container-type: inline-size;
  container-name: my-card-container;
}

/* CSS mặc định cho Card (khi không gian hẹp) */
.card {
  display: flex;
  flex-direction: column; /* Bố cục dọc */
}

/* Bước 2: Truy vấn dựa trên kích thước của container */
@container my-card-container (min-width: 500px) {
  /* Nếu container rộng hơn 500px, đổi sang bố cục ngang */
  .card {
    flex-direction: row; 
  }
}
```

## III. VÍ DỤ MINH HỌA

### Xây dựng hệ thống Grid đơn giản bằng Mobile-first

```css
/* Base styles - Mobile first (0px - 767px) */
.col {
  width: 100%; /* Trên mobile, 1 cột chiếm 100% độ rộng (xếp chồng lên nhau) */
  margin-bottom: 15px;
}

/* Tablet styles (768px - 1023px) */
@media screen and (min-width: 768px) {
  .row {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -15px; /* Kéo bù padding của cột */
  }
  
  .col {
    width: 50%; /* 2 cột trên 1 hàng */
    padding: 0 15px;
  }
}

/* Desktop styles (1024px trở lên) */
@media screen and (min-width: 1024px) {
  .col {
    width: 25%; /* 4 cột trên 1 hàng */
  }
}
```

### Xử lý Giao diện Tối (Dark Mode)

Giao diện tự động đổi màu theo cài đặt hệ thống của người dùng.

```css
:root {
  --bg-color: #ffffff;
  --text-color: #333333;
}

/* Truy vấn nếu người dùng bật Dark Mode trên OS */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --text-color: #f0f0f0;
  }
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s ease;
}
```

## IV. LƯU Ý CẠM BẪY

> [!WARNING]
> **Không mix lộn xộn `min-width` và `max-width` quá nhiều**. Nó sẽ tạo ra mã CSS rất khó bảo trì. Hãy chọn một hướng đi (như Mobile-First dùng toàn `min-width`) và tuân thủ nó xuyên suốt dự án. Chỉ dùng `max-width` cho những trường hợp ngoại lệ thực sự cần thiết.

> [!TIP]
> **Breakpoint không nên gắn liền với một thiết bị cụ thể** (như iPad, iPhone 12). Kích thước thiết bị luôn thay đổi mỗi năm. Thay vào đó, hãy thiết kế breakpoints dựa vào **nội dung của bạn**. Mở trình duyệt, kéo nhỏ cửa sổ lại, tại điểm nào mà thiết kế của bạn bị vỡ hoặc khó đọc, điểm đó chính là nơi bạn nên đặt breakpoint mới.

> [!CAUTION]
> **Vấn đề hiệu năng khi dùng quá nhiều Media Queries**: Mặc dù không quá đáng lo ngại, nhưng việc băm nhỏ CSS ra hàng chục file khác nhau ứng với mỗi media queries và load chúng qua `<link media="...">` có thể tăng số lượng request. Trình duyệt tải tốn thời gian hơn. Nên gộp chúng vào một hoặc một vài file chính trong quá trình minify.
