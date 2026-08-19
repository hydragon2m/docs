## I. KHÁI QUÁT (OVERVIEW)

### 1. Bản chất của React Native
Khác với các công cụ phát triển ứng dụng di động Hybrid truyền thống (như Cordova, Ionic vốn chạy ứng dụng web bên trong một thẻ `<iframe />` gọi là WebView), **React Native** cho phép bạn viết mã bằng JavaScript/React nhưng ứng dụng biên dịch ra các thành phần giao diện **Native thực tế** của hệ điều hành iOS và Android.

Để kết nối giữa thế giới JavaScript và thế giới Native (Java/Kotlin trên Android, Objective-C/Swift trên iOS), React Native sử dụng một kiến trúc truyền thông tin. Việc hiểu rõ sự tiến hóa của kiến trúc này là yếu tố cốt lõi để bạn viết ứng dụng di động có hiệu năng mượt mà và tối ưu bộ nhớ.

```mermaid
flowchart TD
    subgraph OldArch["Kiến trúc cũ (Bridge)"]
        JS1["JavaScript Thread<br/>(Logic React)"] -->|JSON hóa tuần tự| Bridge["The Bridge (Cầu nối nghẽn)"]
        Bridge -->|Giải mã JSON| Native1["Native Thread (UI/Device)"]
    end
    
    subgraph NewArch["Kiến trúc mới (JSI)"]
        JS2["JavaScript Engine (Hermes)"] -->|JSI (JavaScript Interface)| Native2["C++ Native Objects<br/>(Gọi trực tiếp không đồng bộ)"]
    end
```

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Kiến trúc cũ và Hạn chế của The Bridge (Cầu nối)
Trong kiến trúc cũ, thế giới JavaScript và thế giới Native hoàn toàn mù tịt về nhau. Chúng giao tiếp qua **The Bridge**:
1.  Mọi thông điệp (như vẽ nút bấm, bắt sự kiện click) đều phải được chuyển đổi thành chuỗi JSON (**JSON Serialization**).
2.  Gửi bất đồng bộ (Asynchronous) qua Bridge.
3.  Phía bên kia nhận được, giải mã JSON và thực thi.
*   *Điểm nghẽn (Bottleneck):* Khi người dùng cuộn một danh sách dài vô tận hoặc thực hiện các hoạt hình (animations) vuốt chạm liên tục, hàng triệu thông điệp JSON bị dồn ứ trên Bridge, gây ra hiện tượng giật lag màn hình (drop FPS).

---

### 2. Kiến trúc mới (New Architecture) & JSI (JavaScript Interface)
Kiến trúc mới loại bỏ hoàn toàn The Bridge và thay thế bằng **JSI** (JavaScript Interface) viết bằng C++:
*   **JSI là gì:** Là một bộ khung cho phép JS engine tham chiếu trực tiếp tới các đối tượng C++ của phía Native và ngược lại.
*   **Lợi ích:** Các hàm Native giờ đây có thể được gọi đồng bộ (Synchronously) và trực tiếp từ JavaScript mà không cần thông qua bước tuần tự hóa JSON $\rightarrow$ Hiệu năng mượt mà tương đương app Native thuần túy.

#### Các thành phần chính của Kiến trúc mới:
1.  **Hermes Engine:** Trình biên dịch JavaScript siêu nhẹ được Facebook tối ưu hóa riêng cho thiết bị di động, giúp app khởi động cực nhanh và tốn ít RAM hơn V8 hay JSC.
2.  **Fabric:** Hệ thống dựng hình (Renderer) mới thay thế cho UI Manager cũ, giúp cập nhật giao diện mượt mà và hỗ trợ tính năng đồng thời (Concurrent rendering).
3.  **TurboModules:** Cơ chế tải module Native chậm (Lazy loading), chỉ nạp các module thiết bị (như Camera, Bluetooth) vào bộ nhớ khi ứng dụng thực sự gọi đến.

---

### 3. Mô hình luồng (Thread Model) của React Native
Một ứng dụng React Native hoạt động song song trên 3 luồng chính:
1.  **JS Thread:** Nơi chạy code JavaScript, xử lý logic React, gọi API và quản lý State.
2.  **Shadow Thread (Layout Thread):** Chạy code C++ của Yoga Layout Engine để tính toán kích thước, vị trí các phần tử (tương tự CSS Flexbox) trước khi gửi thông tin xuống Native.
3.  **UI Thread (Main Thread):** Luồng chính của hệ điều hành di động, chịu trách nhiệm vẽ giao diện thực tế và lắng nghe tương tác vuốt chạm.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Minh họa luồng dữ liệu khi thực hiện Gọi Native API thông qua JSI
Dưới đây là một ví dụ giả lập code C++/TypeScript minh họa cách JavaScript gọi trực tiếp một hàm lấy thông tin bộ nhớ thiết bị của hệ thống Native thông qua JSI mà không bị trễ bất đồng bộ.

```typescript
// File: src/native/DeviceMemory.ts
// Giả lập một TurboModule sử dụng JSI trong Kiến trúc mới

export interface Spec {
  // Hàm lấy dung lượng RAM khả dụng (đồng bộ, trả về ngay lập tức)
  getAvailableRAM(): number;
}

// Trong kiến trúc cũ, ta phải viết:
// NativeModules.DeviceMemory.getAvailableRAM((ram) => { console.log(ram) }); (Bất đồng bộ)

// Trong kiến trúc mới (JSI):
// C++ Object được ánh xạ trực tiếp thành global object trong môi trường JS của Hermes
const DeviceMemoryModule = (global as any).__DeviceMemoryJSI__ as Spec;

export const printMemoryStatus = () => {
  // Gọi ĐỒNG BỘ trực tiếp qua JSI, tốc độ tính bằng nano-giây
  const ramMB = DeviceMemoryModule.getAvailableRAM();
  console.log(`Dung lượng RAM trống thực tế đo từ OS: ${ramMB} MB`);
};
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & BEST PRACTICES)

### 1. Cạm bẫy nghẽn JS Thread do chạy tác vụ nặng
*   **Vấn đề:** Do JavaScript chạy đơn luồng (JS Thread), nếu bạn viết một vòng lặp tính toán quá nặng (ví dụ: giải mã một file ảnh lớn, sắp xếp mảng khổng lồ):
*   **Hậu quả:** JS Thread bị block $\rightarrow$ Các sự kiện vuốt chạm từ UI Thread gửi lên không được xử lý $\rightarrow$ Nút bấm bị đơ, giao diện app bị đóng băng.
*   ✅ *Best practice:* Đẩy các tác vụ nặng xuống phía Native (C++ hoặc Java/Swift) xử lý ngầm, hoặc chia nhỏ tác vụ bằng `requestAnimationFrame`.

---

## 💡 5 QUY TẮC VÀNG VỀ KIẾN TRÚC REACT NATIVE
1.  **Bật Hermes Engine mặc định:** Tối ưu dung lượng file cài đặt (APK/IPA), giảm RAM tiêu thụ và tăng tốc độ khởi chạy app.
2.  **Chuyển đổi sang Kiến trúc mới (JSI):** Tận dụng tối đa tốc độ gọi module native đồng bộ và loại bỏ nút thắt cổ chai JSON Bridge.
3.  **Tránh chạy phép toán nặng trên JS Thread:** Giữ cho luồng JS luôn rảnh rỗi để phản hồi tức thì các sự kiện tương tác của người dùng.
4.  **Tách biệt logic layout:** Hiểu rõ Shadow Thread sử dụng Yoga Engine để căn chỉnh Flexbox trên mobile (luôn mặc định xếp dọc `flex-direction: column`).
5.  **Dùng TurboModules cho thư viện ngoài:** Chỉ cài đặt các thư viện thiết bị có hỗ trợ cơ chế nạp chậm (lazy load) để giữ cho dung lượng RAM khởi động của app ở mức tối giản.
