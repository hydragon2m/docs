# Bài 05 - Responsive Images & Media (Hình ảnh & Media đáp ứng)

## I. KHÁI QUÁT

Việc hiển thị văn bản đáp ứng thì tương đối dễ, nhưng hình ảnh và media (video, iframe) lại là một thách thức lớn trong Responsive Web Design (RWD). 

Mục tiêu chính khi làm việc với ảnh đáp ứng là:
1. **Art Direction (Chỉ đạo nghệ thuật)**: Thay đổi tỷ lệ khung hình hoặc cắt cúp (crop) ảnh khác nhau cho các kích thước màn hình khác nhau (VD: Ảnh toàn cảnh cho desktop, ảnh chân dung tập trung vào khuôn mặt cho mobile).
2. **Resolution Switching (Chuyển đổi độ phân giải)**: Phục vụ file ảnh dung lượng nhỏ (VD: 50KB, 400x400) cho điện thoại, và file ảnh dung lượng lớn (VD: 500KB, 1600x1600) cho màn hình desktop lớn hoặc màn hình Retina để tiết kiệm băng thông mạng.
3. **Mượt mà về mặt bố cục**: Không bị méo ảnh và không gây ra hiện tượng CLS (Cumulative Layout Shift - Layout bị giật do tải ảnh chậm).

> [!IMPORTANT]
> Hơn 60% băng thông của một trang web thường dành cho hình ảnh. Do đó, việc tối ưu hóa hình ảnh đáp ứng (cung cấp đúng kích thước cho đúng thiết bị) là một trong những bước quan trọng nhất trong tối ưu hiệu năng Web.

## II. CHI TIẾT KỸ THUẬT

### 1. Kỹ thuật CSS Cơ bản: `max-width: 100%`

Cách cổ điển và cơ bản nhất. Hình ảnh sẽ không bao giờ tràn ra ngoài thẻ cha của nó. Nếu thẻ cha thu nhỏ, ảnh tự động thu nhỏ theo tỷ lệ.

```css
img {
  max-width: 100%;
  height: auto; /* Đảm bảo duy trì tỷ lệ khung hình */
}
```

### 2. Resolution Switching với thuộc tính `srcset` và `sizes`

Sử dụng thẻ `<img>` kết hợp `srcset` giúp trình duyệt tự động lựa chọn ảnh phù hợp nhất dựa trên kích thước màn hình và độ phân giải của thiết bị (như màn hình Retina).

```html
<img 
  srcset="elva-fairy-480w.jpg 480w,
          elva-fairy-800w.jpg 800w,
          elva-fairy-1200w.jpg 1200w"
  sizes="(max-width: 600px) 480px,
         (max-width: 1000px) 800px,
         1200px"
  src="elva-fairy-800w.jpg" 
  alt="Elva dressed as a fairy" />
```

**Giải thích:**
- `srcset`: Danh sách các ảnh có sẵn kèm theo thông tin kích thước gốc của chúng (đơn vị `w` là chiều rộng thật của file ảnh).
- `sizes`: Cho trình duyệt biết ảnh này sẽ chiếm không gian bao nhiêu trên màn hình ở các breakpoint khác nhau. (Ví dụ: Nếu màn hình dưới 600px, tôi dự định hiển thị ảnh rộng 480px).
- Trình duyệt sẽ đọc `sizes` trước, xem màn hình hiện tại là bao nhiêu, tính toán và nhìn lên `srcset` để download file ảnh phù hợp nhất (Không download dư).

### 3. Art Direction với thẻ `<picture>`

Khi bạn muốn thay đổi hẳn BỐ CỤC bức ảnh (ví dụ crop ở mobile) thay vì chỉ thay đổi độ phân giải. Thẻ `<picture>` kết hợp với `<source>` cho phép sử dụng Media Queries ngay trong HTML.

```html
<picture>
  <!-- Hiển thị ảnh ngang nếu màn hình >= 800px -->
  <source media="(min-width: 800px)" srcset="hero-landscape.jpg">
  
  <!-- Hiển thị ảnh vuông cho màn hình từ 400px đến 799px -->
  <source media="(min-width: 400px)" srcset="hero-square.jpg">
  
  <!-- Fallback/Default cho mobile (< 400px) -->
  <img src="hero-portrait.jpg" alt="A hero image">
</picture>
```

### 4. Thuộc tính `object-fit` trong CSS

Rất quan trọng khi bạn có một khung (container) cố định kích thước, và muốn nhét một bức ảnh vào đó mà không bị méo (giống như `background-size`).

| Giá trị | Hành vi |
|---------|---------|
| `fill` | Mặc định. Ảnh kéo giãn ra phủ kín container, bóp méo tỷ lệ. |
| `contain` | Ảnh thu nhỏ/phóng to để vừa khít container, giữ nguyên tỷ lệ (có thể để lại viền trống). |
| `cover` | Ảnh lấp kín hoàn toàn container, cắt bỏ phần thừa (crop), không méo. (Thường dùng nhất) |
| `none` | Ảnh giữ nguyên kích thước gốc. |

```css
.card-image {
  width: 100%;
  height: 250px;
  object-fit: cover; /* Cắt ảnh đẹp đẽ không méo! */
  object-position: top center; /* Chỉ định phần nào của ảnh sẽ được hiển thị */
}
```

## III. VÍ DỤ MINH HỌA

### Responsive Iframe / Video YouTube (Duy trì tỷ lệ khung hình 16:9)

Khi nhúng Video Youtube bằng Iframe, iframe mặc định không responsive theo chiều cao. Đây là một mẹo CSS kinh điển (gọi là Padding-Bottom hack). Tuy nhiên, ngày nay ta có thuộc tính `aspect-ratio`.

**Cách mới (Khuyên dùng hiện tại):**
```css
.video-container {
  width: 100%;
  aspect-ratio: 16 / 9; /* CSS hiện đại tự tính toán chiều cao */
}

.video-container iframe {
  width: 100%;
  height: 100%;
}
```

### Hỗ trợ định dạng ảnh hiện đại (WebP/AVIF)

Thẻ `<picture>` không chỉ dùng cho Art Direction, mà còn dùng để cung cấp các định dạng ảnh nhẹ hơn như WebP cho các trình duyệt hỗ trợ, trong khi vẫn fallback về JPG/PNG cho trình duyệt cũ.

```html
<picture>
  <!-- Thử tải AVIF trước (nhẹ nhất) -->
  <source type="image/avif" srcset="photo.avif">
  <!-- Nếu không hỗ trợ AVIF, thử tải WebP -->
  <source type="image/webp" srcset="photo.webp">
  <!-- Fallback cuối cùng cho trình duyệt cũ (IE, Safari cũ) -->
  <img src="photo.jpg" alt="Description">
</picture>
```

## IV. LƯU Ý CẠM BẪY

> [!WARNING]
> **Hiện tượng Cumulative Layout Shift (CLS)**: Khi một trang web load ảnh, nếu bạn không quy định sẵn chiều cao/rộng, nội dung phía dưới ảnh sẽ bị "giật" (đẩy xuống) khi ảnh tải xong. Điều này làm giảm điểm SEO (Core Web Vitals).
> **Cách khắc phục**: Luôn khai báo thuộc tính `width` và `height` trên thẻ HTML `<img>`, ngay cả khi bạn dùng CSS `max-width: 100%; height: auto;`. Trình duyệt sẽ dùng tỷ lệ của width/height HTML để dành sẵn không gian ngay trước khi ảnh được tải xong.
> `<img src="img.jpg" width="800" height="600" alt="..">`

> [!TIP]
> **Lazy Loading**: Bạn không cần viết Javascript phức tạp nữa. Bổ sung `loading="lazy"` vào thẻ img để tự động trì hoãn việc tải các hình ảnh nằm ngoài màn hình (below the fold) cho đến khi người dùng cuộn tới gần chúng. Giúp tăng tốc độ tải trang cực kỳ mạnh.
> `<img src="heavy-image.jpg" loading="lazy" alt="...">`

> [!CAUTION]
> Chú ý rằng `loading="lazy"` **không nên** đặt trên các hình ảnh nằm ở khu vực trên cùng (above-the-fold) hoặc là thành phần quan trọng của màn hình đầu tiên như Hero Image hoặc Logo. Việc dùng lazy loading sai chỗ có thể làm LCP (Largest Contentful Paint) tăng lên, khiến trang bị đánh giá là tải chậm.
