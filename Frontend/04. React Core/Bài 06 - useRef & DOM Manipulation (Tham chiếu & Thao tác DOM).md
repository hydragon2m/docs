## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần `useRef`?
Trong React, luồng cập nhật UI được kích hoạt tự động mỗi khi State thay đổi. Tuy nhiên, trong thực tế phát triển web, có 2 trường hợp đặc biệt không thể giải quyết bằng mô hình khai báo thông thường:
1.  **Lưu trữ giá trị có thể thay đổi (Mutable value) nhưng không muốn kích hoạt re-render:** Ví dụ: lưu ID của một bộ đếm thời gian (`timerId`), lưu số lần người dùng đã thực hiện một hành động. Nếu lưu các giá trị này vào State, mỗi lần cập nhật sẽ làm component re-render vô ích, làm giảm hiệu năng.
2.  **Thao tác trực tiếp với các phần tử DOM của trình duyệt:** Ví dụ: lấy focus của ô input, cuộn trang đến một vị trí cụ thể (scroll), đo đạc kích thước thực tế của một thẻ HTML.

Hook **`useRef`** ra đời để giải quyết cả hai bài toán trên bằng cách cung cấp một "hộp chứa" có thuộc tính `.current` tồn tại bền vững qua mọi lần render.

```mermaid
flowchart TD
    StateChange["Thay đổi State: setVal(newValue)"] --> Trigger["Kích hoạt Re-render Component"]
    RefChange["Thay đổi Ref: ref.current = newValue"] --> NoTrigger["KHÔNG kích hoạt Re-render"]
    
    Component["Component Render"] -->|useRef(initial)| Box["Tạo ra một Object: { current: initial }"]
    Box -->|Được giữ nguyên địa chỉ bộ nhớ| Component
```

> [!IMPORTANT]
> **Khác biệt cốt lõi giữa State và Ref:**
> *   **State:** Lưu trữ dữ liệu ảnh hưởng trực tiếp đến UI hiển thị. Thay đổi State $\rightarrow$ Re-render.
> *   **Ref:** Lưu trữ dữ liệu phụ trợ, hoặc tham chiếu DOM. Thay đổi Ref.current $\rightarrow$ Không re-render.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Cơ chế hoạt động của `useRef` trong Bộ nhớ
Khi bạn gọi `const myRef = useRef(initialValue)`, React tạo ra một đối tượng JavaScript đơn giản:
```javascript
{ current: initialValue }
```
Địa chỉ vùng nhớ của đối tượng này được React đảm bảo **luôn ổn định** và không bao giờ thay đổi giữa các lần render của component.
Do đó, việc bạn ghi đè giá trị `myRef.current = newValue` chỉ đơn thuần là thay đổi một thuộc tính của object, trình duyệt không thực hiện bất kỳ phép so sánh nào và không kích hoạt lại hàm component.

---

### 2. Thao tác với DOM trong React
Để tham chiếu đến một DOM node, bạn chỉ cần truyền đối tượng ref vào thuộc tính `ref` của thẻ HTML:
```tsx
const inputRef = useRef<HTMLInputElement>(null);
// ...
return <input ref={inputRef} />;
```
Sau khi component mount và vẽ lên màn hình, React sẽ tự động gán phần tử DOM thực tế của trình duyệt vào `inputRef.current`. Bạn có thể truy cập toàn bộ API của DOM thông qua thuộc tính này.

---

### 3. Kỹ thuật chuyển tiếp Ref (`forwardRef` & `useImperativeHandle`)
Mặc định, bạn không thể truyền thuộc tính `ref` vào một Component tự định nghĩa (Custom Component) vì React không tự động chuyển tiếp ref qua các ranh giới component con.

#### a. `forwardRef`
Để cho phép component cha truy cập vào phần tử DOM con bên trong component con, bạn phải bọc component con trong hàm `React.forwardRef`:

```tsx
// Component con
const CustomInput = React.forwardRef<HTMLInputElement, any>((props, ref) => {
  return <input ref={ref} className="custom-input" {...props} />;
});
```

#### b. `useImperativeHandle`
Trong một số trường hợp, Component con không muốn phơi bày toàn bộ DOM node của nó ra ngoài (gây mất an toàn cấu trúc), mà chỉ muốn cung cấp một vài hàm chức năng cụ thể (như `focus`, `clear`). Bạn có thể kết hợp `forwardRef` và `useImperativeHandle` để tùy biến các API phơi bày ra ngoài:

```tsx
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

export interface FancyInputHandle {
  focusAndClear: () => void;
}

export const FancyInput = forwardRef<FancyInputHandle, any>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Định nghĩa các hàm cụ thể mà cha có thể gọi
  useImperativeHandle(ref, () => ({
    focusAndClear: () => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.value = '';
      }
    }
  }));

  return <input ref={inputRef} type="text" className="fancy-input" />;
});
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Sử dụng Ref làm bộ nhớ đệm (Mutable Value) không gây re-render
Dưới đây là một ví dụ thực tế về việc dựng một Timer đếm giây. Chúng ta cần lưu trữ `timerId` để dọn dẹp khi người dùng dừng timer hoặc unmount component. Nếu lưu `timerId` vào State, mỗi giây trôi qua Component sẽ bị re-render lại vô ích.

```tsx
// File: src/components/Stopwatch.tsx
import React, { useState, useRef, useEffect } from 'react';

export const Stopwatch: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  
  // Sử dụng useRef để lưu trữ timerId của setInterval.
  // Kiểu dữ liệu là NodeJS.Timeout (hoặc number trên trình duyệt).
  const timerIdRef = useRef<number | null>(null);

  const startTimer = () => {
    if (timerIdRef.current !== null) return; // Tránh chạy lặp nhiều interval

    timerIdRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null; // Reset ref về null
    }
  };

  // Luôn dọn dẹp timer khi component bị hủy để tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      if (timerIdRef.current !== null) {
        window.clearInterval(timerIdRef.current);
      }
    };
  }, []);

  return (
    <div className="stopwatch">
      <h2>Thời gian: {seconds} giây</h2>
      <button onClick={startTimer}>Bắt đầu</button>
      <button onClick={stopTimer}>Dừng</button>
    </div>
  );
};
```

---

### 2. Kỹ thuật Ref Callback để đo kích thước phần tử DOM động
Thông thường chúng ta truyền trực tiếp ref object vào thẻ HTML. Tuy nhiên, nếu bạn muốn thực hiện một hành động (như đo đạc kích thước) ngay khi phần tử DOM thực tế được thêm vào hoặc xóa bỏ khỏi trang, hãy sử dụng **Ref Callback Pattern**.

```tsx
// File: src/components/DynamicBox.tsx
import React, { useState, useCallback } from 'react';

export const DynamicBox: React.FC = () => {
  const [height, setHeight] = useState(0);

  // Thay vì truyền object, truyền một hàm useCallback.
  // Trình duyệt sẽ gọi hàm này và truyền DOM node thực tế vào làm đối số
  // bất cứ khi nào phần tử đó mount hoặc unmount.
  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      // Đo chiều cao của box và cập nhật state để hiển thị lên UI
      setHeight(node.getBoundingClientRect().height);
    }
  }, []); // Không có dependency để hàm ổn định địa chỉ

  return (
    <div>
      <div ref={measuredRef} className="box" style={{ padding: '20px', background: '#ccc' }}>
        <h3>Hộp đo lường động</h3>
        <p>Thêm bớt nội dung sẽ làm thay đổi chiều cao của tôi.</p>
      </div>
      <p>Chiều cao đo được của hộp ở trên là: {height}px</p>
    </div>
  );
};
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & BEST PRACTICES)

### 1. Đọc hoặc ghi `ref.current` trong quá trình Render
*   **Hành vi nguy hiểm:** Thay đổi hoặc lấy giá trị `ref.current` trực tiếp ở phần thân component (ngoài `useEffect` hoặc event handler).
*   ❌ *Anti-pattern:*
    ```tsx
    const MyComponent = () => {
      const renderCount = useRef(0);
      renderCount.current++; // ❌ Ghi trực tiếp trong thân hàm render
      return <div>Lần render: {renderCount.current}</div>;
    };
    ```
*   **Giải thích:** Quá trình render của React phải đảm bảo là một hàm thuần túy và có thể chạy lại nhiều lần bất kỳ lúc nào (trong Concurrent Mode). Việc ghi trực tiếp vào ref trong render làm mất tính thuần túy và có thể dẫn đến lỗi hiển thị sai dữ liệu.
*   ✅ *Best practice:* Chỉ đọc/ghi ref bên trong các sự kiện (event handlers) hoặc trong `useEffect`.

### 2. Lạm dụng Ref thay thế cho State
*   Không được lạm dụng Ref để thay thế hoàn toàn cho State chỉ vì muốn tránh re-render. Nếu dữ liệu đó cần được hiển thị lên màn hình hoặc ảnh hưởng đến layout UI, nó **bắt buộc** phải là State.

---

## 💡 5 QUY TẮC VÀNG KHI SỬ DỤNG REF
1.  **Ref cho DOM, State cho UI:** Chỉ dùng ref để tham chiếu phần tử HTML thực tế hoặc lưu dữ liệu phụ không cần hiển thị trực tiếp lên UI.
2.  **Không đọc/ghi ref.current trong thân hàm render:** Chỉ thao tác với ref.current bên trong `useEffect` hoặc các hàm xử lý sự kiện.
3.  **Luôn dọn dẹp tài nguyên lưu trong Ref:** Nếu ref lưu trữ Timer ID, WebSocket, hoặc các tiến trình chạy ngầm, hãy đảm bảo đã Clear/Close chúng khi component unmount.
4.  **Bảo vệ tính đóng gói với useImperativeHandle:** Khi chuyển tiếp ref cho component cha, hãy giới hạn các API phơi bày ra bên ngoài để tránh component cha can thiệp quá sâu vào DOM nội bộ của con.
5.  **Dùng Ref Callback khi cần phản hồi tức thì với sự kiện gắn DOM:** Sử dụng hàm `ref={(node) => ...}` thay vì object `{current}` nếu cần thực hiện hành động tính toán ngay khi phần tử DOM xuất hiện trên trang.
