# Bài 05 - Dark Mode & Theming (Chế độ tối & Hệ thống giao diện)

## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao Chế độ tối (Dark Mode) trở thành tiêu chuẩn?
Trong thiết kế giao diện hiện đại, **Dark Mode** (chế độ tối) không còn là một tính năng bổ trợ xa xỉ mà đã trở thành yêu cầu bắt buộc để nâng cao trải nghiệm người dùng, giúp giảm mỏi mắt khi sử dụng thiết bị ban đêm và tiết kiệm pin cho màn hình OLED/AMOLED.

Tailwind CSS hỗ trợ xây dựng Dark Mode ngay từ nhân cấu hình cốt lõi. Bằng cách sử dụng tiền tố modifier **`dark:`**, bạn có thể dễ dàng khai báo các màu sắc thay thế sẽ tự động kích hoạt khi người dùng chuyển đổi giao diện hệ thống hoặc click nút đổi theme.

```mermaid
flowchart TD
    Mode["Cách xác định Chế độ tối"] -->|Cách 1: Hệ thống (Media query)| System["prefers-color-scheme<br/>(Tự động theo OS)"]
    Mode -->|Cách 2: Thủ công (Class-based)| Manual["Thêm class .dark vào thẻ html<br/>(Người dùng tự click chọn)"]
    
    System --> Tailwind["Tailwind Engine kích hoạt các class 'dark:... '"]
    Manual --> Tailwind
```

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Phân biệt cơ chế Dark Mode của Tailwind

#### a. Media-based (Mặc định)
Tailwind sử dụng thuộc tính CSS media query `prefers-color-scheme` để tự động phát hiện tùy chọn giao diện từ hệ điều hành của người dùng (Windows, macOS, iOS, Android).
*   *Đặc điểm:* Hoàn toàn tự động, người dùng không thể chọn thủ công theme khác với theme của hệ thống.

#### b. Class-based (Khuyên dùng trong Production)
Cho phép người dùng chủ động nhấp nút chuyển đổi theme (Light/Dark) và lưu cấu hình vào `localStorage`.
*   *Cách cấu hình:* Trong file `tailwind.config.js`, thiết lập thuộc tính `darkMode`:
    ```javascript
    module.exports = {
      darkMode: 'class', // Bật chế độ thủ công bằng thẻ class
      // ...
    }
    ```
*   *Cơ chế kích hoạt:* Khi Tailwind phát hiện thẻ `<html>` hoặc `<body>` có class `dark`, toàn bộ các class có tiền tố `dark:` bên trong cây DOM sẽ được kích hoạt đè lên class cơ bản.

---

### 2. Thiết lập Hệ thống Đa Theme (Multi-theme) bằng CSS Variables + Tailwind
Đối với các hệ thống lớn cần nhiều hơn 2 theme (ví dụ: Light, Dark, Cyberpunk, Forest), việc lạm dụng tiền tố `dark:` sẽ làm code cực kỳ rối rắm.
*   **Giải pháp:** Định nghĩa các token màu sắc trong `tailwind.config.js` dưới dạng các **CSS Variables** (biến CSS), sau đó thay đổi giá trị của các biến này ở thẻ root DOM.

#### Cấu hình biến CSS trong config:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Ánh xạ màu thương hiệu tới biến CSS
        primary: 'var(--color-primary)',
        background: 'var(--color-background)',
      }
    }
  }
}
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Triển khai Theme Toggle Switch hoàn chỉnh trong React
Dưới đây là một Custom Theme Provider sử dụng React Context, tự động kiểm tra cấu hình cũ trong `localStorage` và đồng bộ hóa class `dark` lên thẻ `html` của trình duyệt.

```tsx
// File: src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Khởi tạo state bằng Lazy Initialization để tránh đọc ổ đĩa nhiều lần
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Kiểm tra cấu hình đã lưu trong LocalStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) return savedTheme;

    // 2. Nếu chưa có, kiểm tra cấu hình mặc định của hệ điều hành
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement; // Thẻ <html>

    // 3. Đồng bộ hóa class lên root tag
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 4. Lưu lại tùy chọn vào bộ nhớ trình duyệt
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme phải đặt trong ThemeProvider');
  return context;
};
```

```tsx
// File: src/components/ThemeToggle.tsx
import React from 'react';
import { useAppTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAppTheme();

  return (
    // Dựng giao diện hỗ trợ Dark Mode hoàn chỉnh
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 max-w-sm text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Hệ thống Đổi Theme
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Nhấp nút dưới để kiểm nghiệm khả năng thay đổi màu sắc dựa trên tiền tố dark của Tailwind CSS.
        </p>
        
        <button
          onClick={toggleTheme}
          className="px-6 py-2.5 rounded-lg font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
        >
          {theme === 'light' ? 'Bật Chế độ tối 🌙' : 'Bật Chế độ sáng ☀️'}
        </button>
      </div>
    </div>
  );
};
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & BEST PRACTICES)

### 1. Lỗi chớp màn hình khi tải trang (Flicker / Flash of Light Theme)
*   **Vấn đề:** Khi dùng SSR (Next.js) hoặc SPA tải chậm, trình duyệt tải file React JS về rồi mới chạy `useEffect` để add class `dark`. Điều này khiến trang web bị hiển thị theme sáng (Light) trong khoảng 0.5 giây trước khi chuyển thành theme tối (Dark) $\rightarrow$ Người dùng bị lóa mắt khi mở trang lúc ban đêm.
*   ✅ *Best practice:* Chèn một đoạn mã Script nhỏ, thuần túy đồng bộ (inline blocking script) ngay trong thẻ `<head>` của file `index.html` để kiểm tra theme và thêm class `dark` trước khi trình duyệt kịp render ra bất kỳ thẻ DOM nào.
    ```html
    <head>
      <script>
        // Inline script chặn render để tránh giật theme sáng
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      </script>
    </head>
    ```

---

## 💡 5 QUY TẮC VÀNG VỀ DARK MODE & THEMING
1.  **Cấu hình `darkMode: 'class'`:** Luôn ưu tiên dùng chế độ class để trao quyền kiểm soát chủ động cho người dùng.
2.  **Đặt inline script chặn render ở `<head>`:** Xử lý triệt để lỗi giật chớp màn hình sáng trước khi load xong ứng dụng.
3.  **Dùng biến CSS cho các theme phức tạp:** Tách biệt mã hex màu sắc ra khỏi file config của Tailwind bằng cách bọc qua các biến CSS.
4.  **Luôn đồng bộ màu chữ và màu nền:** Đã viết `bg-white dark:bg-slate-900` thì bắt buộc phải viết kèm `text-slate-900 dark:text-white` để tránh chữ bị ẩn biến mất do trùng màu nền.
5.  **Tối ưu hóa hình ảnh ở Chế độ tối:** Sử dụng class `dark:opacity-80` hoặc `dark:brightness-90` cho các thẻ ảnh để giảm độ rực rỡ chói mắt của hình ảnh trong nền tối.
