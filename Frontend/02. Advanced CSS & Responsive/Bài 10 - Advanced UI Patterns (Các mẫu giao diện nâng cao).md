## I. KHÁI QUÁT

Các hiệu ứng UI/UX hiện đại không chỉ làm đẹp cho ứng dụng web mà còn giúp định hướng người dùng, giảm cảm giác chờ đợi khi tải dữ liệu, và mang lại trải nghiệm tiệm cận với ứng dụng Native (như iOS/Android).

Trong bài này, chúng ta sẽ học cách triển khai 3 mẫu UI phức tạp bằng CSS thuần hiện đại:
1. **Glassmorphism**: Hiệu ứng kính mờ thời thượng.
2. **Skeleton Loading Screen**: Trạng thái tải nội dung mô phỏng cấu trúc.
3. **Scroll Snapping**: Bắt dính điểm cuộn trang mượt mà (chức năng cốt lõi của TikTok/Reels feed).

> [!IMPORTANT]
> Mục tiêu lớn nhất ở đây là đạt được các hiệu ứng phức tạp bằng ít code CSS nhất có thể, thay vì phụ thuộc vào các thư viện JavaScript khổng lồ.

## II. CHI TIẾT KỸ THUẬT & VÍ DỤ MINH HỌA

### 1. Glassmorphism (Hiệu ứng Kính Mờ)

Khởi nguồn từ iOS và Mac, thiết kế Glassmorphism dựa vào sự kết hợp giữa độ trong suốt (opacity), lớp nền mờ đục (backdrop-filter blur), và một đường viền (border) tinh tế.

**HTML:**
```html
<div class="background-shape"></div>
<div class="glass-card">
  <h2>Glassmorphism</h2>
  <p>Thẻ thiết kế kiểu kính mờ trong suốt đẹp mắt.</p>
</div>
```

**CSS:**
```css
/* Một hình nền đa sắc đằng sau thẻ kính để tạo hiệu ứng */
body {
  background: linear-gradient(to right, #ff7e5f, #feb47b);
  height: 100vh;
  display: flex; justify-content: center; align-items: center;
}

.glass-card {
  width: 300px;
  padding: 2rem;
  border-radius: 16px;
  color: white;
  
  /* Lõi của Glassmorphism */
  background: rgba(255, 255, 255, 0.1); /* Màu nền trắng trong suốt */
  backdrop-filter: blur(10px); /* Làm mờ nội dung NẰM SAU thẻ này */
  -webkit-backdrop-filter: blur(10px); /* Cho Safari */
  
  /* Đổ bóng nhẹ để tách khối */
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  
  /* Viền siêu mỏng tạo cảm giác độ dày của mặt kính */
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### 2. Skeleton Loading Screen (Màn hình tải dữ liệu bộ xương)

Thay vì hiện ra một biểu tượng Spinner (xoay vòng) nhàm chán gây cảm giác phải chờ đợi, UI hiện đại ưu tiên hiển thị các khung xám nhấp nháy mô phỏng vị trí của nội dung sắp xuất hiện.

**HTML:**
```html
<div class="skeleton-card">
  <div class="skeleton-avatar skeleton"></div>
  <div class="skeleton-text">
    <div class="skeleton-line skeleton"></div>
    <div class="skeleton-line skeleton short"></div>
  </div>
</div>
```

**CSS:**
```css
.skeleton-card { display: flex; gap: 15px; padding: 20px; }
.skeleton-avatar { width: 50px; height: 50px; border-radius: 50%; }
.skeleton-text { flex: 1; }
.skeleton-line { height: 12px; margin-bottom: 10px; border-radius: 4px; }
.short { width: 60%; }

/* Animation lõi cho mọi lớp .skeleton */
.skeleton {
  /* Hình nền gradient từ sáng -> tối -> sáng */
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%; /* Phóng to background để tạo không gian trượt */
  animation: shimmer 1.5s infinite; /* Chạy vô hạn */
}

@keyframes shimmer {
  0% {
    background-position: -200% 0; /* Bắt đầu từ phía âm ngoài màn hình */
  }
  100% {
    background-position: 200% 0; /* Trượt qua phải tạo hiệu ứng lấp lánh */
  }
}
```

### 3. Scroll Snap (Cuộn Bám Điểm)

Tính năng mà khi bạn cuộn một danh sách hình ảnh (Carousel) hoặc trang, trình duyệt sẽ tự động "hút" (snap) cuộn dừng lại ngay tại vị trí cạnh hoặc giữa của phần tử, không bao giờ dừng ở trạng thái nửa vời.

**HTML:**
```html
<div class="scroll-container">
  <section class="page page-1">Section 1</section>
  <section class="page page-2">Section 2</section>
  <section class="page page-3">Section 3</section>
</div>
```

**CSS:**
```css
.scroll-container {
  height: 100vh;
  overflow-y: scroll; /* Bật cuộn tự do */
  
  /* Bật tính năng Scroll Snap trên container */
  /* y: Bắt theo chiều dọc. mandatory: Bắt buộc phải bám dính, không được lấp lửng */
  scroll-snap-type: y mandatory; 
  scroll-behavior: smooth;
}

.page {
  height: 100vh; /* Mỗi thẻ bằng 1 màn hình (như TikTok) */
  display: flex; justify-content: center; align-items: center;
  font-size: 3rem;
  
  /* Định nghĩa điểm mà phần tử sẽ bị "hút" vào container */
  scroll-snap-align: start; /* Hút mép trên cùng của .page vào đầu viewport */
}

/* Các màu phân biệt */
.page-1 { background: #3498db; }
.page-2 { background: #e74c3c; }
.page-3 { background: #2ecc71; }
```

## III. LƯU Ý CẠM BẪY & BEST PRACTICES

> [!WARNING]
> Thuộc tính `backdrop-filter` (Glassmorphism) cực kỳ nặng về mặt xử lý đồ họa (GPU). Nếu bạn áp dụng hiệu ứng này lên các khối div diện tích lớn trên trang, và người dùng cuộn (scroll) trang, nó sẽ tính toán lại độ mờ liên tục và gây giật lag nghiêm trọng trên các máy yếu hoặc trình duyệt cũ. Hạn chế sử dụng ở vùng kích thước nhỏ (như navbar hoặc card nhỏ).

> [!TIP]
> **Scroll Snap UX**: Hãy cân nhắc thay vì dùng giá trị `mandatory` (bắt buộc hút điểm), bạn có thể dùng `proximity` (hút điểm lân cận). `proximity` sẽ chỉ bắt đầu hút (snap) khi người dùng cuộn đến GẦN mép, điều này mang lại cảm giác cuộn tự nhiên hơn mà không quá "cưỡng bức" sự điều khiển của người dùng.

> [!CAUTION]
> Với **Skeleton Loaders**, đừng lạm dụng chúng nếu dữ liệu của bạn trả về từ server cực nhanh (dưới 200ms). Việc nhấp nháy skeleton nhanh chớp nhoáng rồi nhảy sang nội dung thật sẽ tạo cảm giác "Flash of Loading", làm phiền mắt người dùng hơn là để trang trống một chút. Hãy dùng độ trễ nhẹ (JS `setTimeout` khoảng 300ms) trước khi quyết định hiện màn hình Skeleton.
