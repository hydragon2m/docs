# Bài 11: CSS Animations & Keyframes (Hoạt hình & Khung hình chính)

## I. KHÁI QUÁT (OVERVIEW)
Nếu `transition` giới hạn bạn ở một hành trình từ A đến B (cần một tác động như `:hover`), thì `CSS Animations` là một bộ phim điện ảnh: Nó tự động phát, có thể lặp lại vô tận, có thể tạm dừng, và có vô số điểm chạm trung gian từ A -> B -> C -> D nhờ vào khái niệm `@keyframes` (Khung hình chính).

```mermaid
graph TD
    A[CSS Animation] --> B[@keyframes]
    A --> C[Thuộc tính Animation]
    B --> D[Định nghĩa kịch bản % thời lượng]
    B --> E[0% / from, 100% / to]
    C --> F[name, duration, iteration-count]
    C --> G[direction, fill-mode, play-state]
```

> [!NOTE]
> Animation là con dao hai lưỡi. Sử dụng vừa đủ như spinner loading, thông báo toast trượt vào sẽ làm web sinh động. Lạm dụng animation rung giật liên tục sẽ khiến người dùng chóng mặt và rời bỏ trang web ngay lập tức.

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. @keyframes: Viết kịch bản
`@keyframes` định nghĩa sự thay đổi phong cách diễn ra như thế nào dọc theo chuỗi thời gian (0% đến 100%).
```css
@keyframes slideInFade {
    0%   { opacity: 0; transform: translateX(-50px); }
    50%  { opacity: 0.5; }
    100% { opacity: 1; transform: translateX(0); }
}
```

### 2. Animation Properties: Bộ phát video
Khi kịch bản (keyframes) đã có, bạn phải gắn nó vào một phần tử bằng `animation`.
| Thuộc tính | Vai trò | Ví dụ |
|---|---|---|
| `animation-name` | Gọi tên keyframes. | `slideInFade` |
| `animation-duration`| Tổng thời gian chạy 1 vòng. | `2s` |
| `animation-iteration-count`| Số lần lặp lại. | `infinite`, `1`, `3` |
| `animation-direction`| Chiều chạy. | `normal`, `reverse`, `alternate` |
| `animation-timing-function`| Đường cong gia tốc. | `ease-out`, `linear`, `steps(5)` |
| `animation-fill-mode`| Trạng thái của phần tử sau khi xong phim. | `forwards` (đứng lại ở frame 100%), `backwards` |

> [!TIP]
> Thuộc tính `animation-fill-mode: forwards` đặc biệt quan trọng. Nếu không có nó, phần tử đang bay ngang màn hình và dừng lại, lập tức sẽ "biến mất" giật về vị trí 0% ngay khi animation kết thúc.

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

```css
/* =============================
   1. LOADING SPINNER QUAY VÔ TẬN
   ============================= */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    /* Gọi animation spin, chạy 1s, đều đặn linear, vô hạn */
    animation: spin 1s linear infinite;
}

/* =============================
   2. HIỆU ỨNG THÔNG BÁO HIỂN THỊ (TOAST SLIDE IN)
   ============================= */
@keyframes toastEntrance {
    0% {
        opacity: 0;
        transform: translateY(50px) scale(0.9);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.toast-notification {
    background-color: #333;
    color: white;
    padding: 16px;
    border-radius: 8px;
    position: fixed;
    bottom: 20px;
    right: 20px;
    
    /* Chạy 1 lần, ease-out (chậm dần về đích) và ĐỨNG LẠI (forwards) */
    animation: toastEntrance 0.5s ease-out forwards;
}

/* =============================
   3. NHỊP ĐẬP TRÁI TIM (PULSE ALERT)
   ============================= */
@keyframes pulseHeart {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
}

.btn-sale {
    /* Chạy vĩnh viễn, giúp thu hút chú ý vào nút Call to Action */
    animation: pulseHeart 1.5s ease-in-out infinite;
}
```

**Phân tích Code:**
- Nút `.loader` sử dụng `linear`. Đây là yếu tố cực kỳ then chốt với hiệu ứng quay tròn vô tận. Nếu dùng `ease`, cái vòng sẽ quay nhanh chững lại rồi lại quay nhanh, tạo cảm giác bị khựng, hỏng máy. 
- Component `.toast-notification` sử dụng kịch bản kết hợp vừa bay lên (translate) vừa rõ dần (opacity) và to ra mượt mà (scale). Phải dùng `forwards` để khi thông báo hiển thị xong, nó nằm đó cho người dùng đọc, chứ không biến mất nháy nháy.

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & BEST PRACTICES)

1. **Hiệu năng GPU:** Khuyến cáo lặp lại của bài học trước: CHỈ animation các thuộc tính `transform` và `opacity`. Animation `margin`, `width`, `height` bằng infinite sẽ làm nóng CPU máy tính của người dùng nhanh chóng.
2. **Accessibility (Hội chứng rối loạn tiền đình):** Rất nhiều người bị hoa mắt với hoạt hình web. LUÔN LUÔN phải tôn trọng cài đặt hệ thống của họ bằng query: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`. Dòng code này sẽ tắt hoạt hình với những người không muốn nó.
3. **Quản lý bằng class:** Thay vì nhúng sẵn animation vào HTML element gốc, hãy tạo một class `.animate-me` và dùng Javascript thêm vào element khi người dùng cuộn (scroll) tới nó.

### 💡 QUY TẮC VÀNG
> Sử dụng `linear` cho hiệu ứng Loading xoay vòng, `ease-out` cho hiệu ứng xuất hiện. Sử dụng `animation-fill-mode: forwards` để neo trạng thái cuối. Bắt buộc hỗ trợ `@media (prefers-reduced-motion: reduce)` trong một dự án tử tế.