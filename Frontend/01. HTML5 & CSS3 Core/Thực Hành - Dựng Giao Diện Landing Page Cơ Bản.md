# Thực Hành - Dựng Giao Diện Landing Page Cơ Bản

Bài thực hành này giúp bạn củng cố toàn bộ kiến thức về HTML5 Semantic, CSS Selector, Box Model và Positioning bằng cách tự dựng một giao diện Landing Page đơn giản.

---

## 🎯 Yêu cầu Giao diện
Bạn cần dựng một trang web có các phần sau:
1.  **Header cố định:** Chứa logo và thanh điều hướng chính. Khi cuộn trang, thanh Header này phải dính ở trên đầu màn hình.
2.  **Hero Section:** Banner giới thiệu chính với nút kêu gọi hành động (CTA Button) được thiết kế bằng `inline-block`, hover đổi màu.
3.  **Features List:** Danh sách 3 tính năng chính xếp cạnh nhau (sử dụng thuộc tính `display` hoặc định vị thích hợp).
4.  **Chân trang (Footer):** Chứa thông tin bản quyền và nằm cố định ở đáy trang.

---

## 🛠️ Mã nguồn mẫu để bắt đầu

### 1. File HTML (`index.html`)
Tạo một file đặt tên là `index.html` và dán đoạn code cấu trúc sau:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page Thực Hành | Frontend Core</title>
  <meta name="description" content="Trang thực hành HTML5 và CSS3 cơ bản dành cho người mới bắt đầu học Frontend.">
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- 1. Header & Navigation -->
  <header class="main-header">
    <div class="logo">MyBrand</div>
    <nav class="nav-menu">
      <a href="#home">Trang chủ</a>
      <a href="#features">Tính năng</a>
      <a href="#about">Về chúng tôi</a>
    </nav>
  </header>

  <!-- 2. Hero Section -->
  <section id="home" class="hero">
    <div class="hero-content">
      <h1>Chào mừng đến với Khóa học Frontend</h1>
      <p>Học lập trình giao diện web chuyên nghiệp từ con số 0 cùng lộ trình chi tiết nhất.</p>
      <a href="#register" class="btn-cta">Đăng ký ngay</a>
    </div>
  </section>

  <!-- 3. Features Section -->
  <section id="features" class="features-section">
    <h2>Tại sao bạn nên chọn chúng tôi?</h2>
    
    <div class="feature-container">
      <article class="feature-card">
        <div class="card-badge">Mới</div>
        <h3>Học từ cơ bản</h3>
        <p>Lộ trình rõ ràng từ HTML/CSS chuẩn chỉnh cho người mới bắt đầu.</p>
      </article>

      <article class="feature-card">
        <h3>Thực hành thực tế</h3>
        <p>Hơn 50 bài tập code thực tế giúp bạn nhớ lâu và tích lũy sản phẩm dự án.</p>
      </article>

      <article class="feature-card">
        <h3>Chuẩn Next.js & React</h3>
        <p>Tiếp cận công nghệ hiện đại nhất đang được các doanh nghiệp săn đón.</p>
      </article>
    </div>
  </section>

  <!-- 4. Footer -->
  <footer class="main-footer">
    <p>&copy; 2026 Frontend Roadmap. Đã đăng ký bản quyền.</p>
  </footer>

</body>
</html>
```

### 2. File CSS Gợi ý (`style.css`)
Tạo file `style.css` nằm cùng thư mục với file `index.html` và viết CSS để giải quyết các yêu cầu sau:

```css
/* ==========================================================================
   1. Reset & Global Styles
   ========================================================================== */
*, *::before, *::after {
  box-sizing: border-box; /* Giúp tính toán Box Model chính xác */
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f9f9f9;
}

/* ==========================================================================
   2. Header Styles (Yêu cầu: position dính trên đầu trang)
   ========================================================================== */
.main-header {
  position: fixed; /* Hoặc dùng sticky */
  top: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background-color: #ffffff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  z-index: 1000; /* Luôn nổi trên các phần tử khác */
  
  /* Căn lề các thành phần bên trong */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5%;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #1a73e8;
}

.nav-menu a {
  text-decoration: none;
  color: #555;
  margin-left: 20px;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-menu a:hover {
  color: #1a73e8; /* Đổi màu khi hover */
}

/* ==========================================================================
   3. Hero Section Styles
   ========================================================================== */
.hero {
  height: 80vh;
  background: linear-gradient(135deg, #1a73e8, #8ab4f8);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 20px;
  margin-top: 70px; /* Tránh bị che mất bởi Header fixed */
}

.hero-content h1 {
  font-size: 42px;
  margin-bottom: 20px;
}

.hero-content p {
  font-size: 18px;
  margin-bottom: 30px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.btn-cta {
  display: inline-block; /* Để set padding & margin */
  background-color: #ff9900;
  color: white;
  text-decoration: none;
  padding: 12px 30px;
  border-radius: 5px;
  font-weight: bold;
  transition: background-color 0.3s, transform 0.2s;
}

.btn-cta:hover {
  background-color: #e68a00;
  transform: translateY(-2px); /* Hiệu ứng nổi lên nhẹ */
}

/* ==========================================================================
   4. Features Section Styles (Yêu cầu: Căn các Card nằm ngang)
   ========================================================================== */
.features-section {
  padding: 80px 5%;
  text-align: center;
}

.features-section h2 {
  font-size: 32px;
  margin-bottom: 40px;
}

.feature-container {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  flex-wrap: wrap; /* Hỗ trợ màn hình nhỏ tự xuống dòng */
}

.feature-card {
  flex: 1;
  min-width: 250px;
  background-color: white;
  padding: 40px 25px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  position: relative; /* Dùng làm mốc tọa độ cho badge */
}

/* Yêu cầu: Sử dụng Absolute Positioning */
.card-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background-color: #ff3366;
  color: white;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 3px;
  font-weight: bold;
}

.feature-card h3 {
  margin: 15px 0;
  color: #111;
}

.feature-card p {
  color: #666;
  font-size: 14px;
}

/* ==========================================================================
   5. Footer Styles
   ========================================================================== */
.main-footer {
  background-color: #222;
  color: #888;
  text-align: center;
  padding: 20px;
  font-size: 14px;
}
```

---

## 🔍 Cách xem sản phẩm chạy thử:
1.  Lưu cả hai file `index.html` và `style.css` trong cùng một thư mục.
2.  Nhấp đúp chuột vào file `index.html` để mở trực tiếp bằng trình duyệt (Chrome, Edge, Firefox).
3.  Thử cuộn chuột để xem Header có hoạt động cố định hay không, và rê chuột qua các nút bấm để kiểm tra hiệu ứng!
