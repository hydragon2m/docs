## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần `useReducer`?
Khi ứng dụng của bạn lớn lên, việc quản lý trạng thái bằng `useState` có thể trở nên cực kỳ khó khăn.
*   **Vấn đề của `useState`:**
    *   Các logic cập nhật state bị phân mảnh rải rác khắp nơi trong các event handlers của Component.
    *   Khi nhiều state phụ thuộc chéo vào nhau (ví dụ: cập nhật state A yêu cầu cập nhật state B và C), code của bạn sẽ dễ xuất hiện lỗi bất đồng bộ và rất khó để viết Unit Test độc lập cho các logic này.

Hook **`useReducer`** ra đời để giải quyết triệt để bài toán này bằng cách áp dụng mô hình kiến trúc **Flux/Redux** (được lấy cảm hứng từ Lập trình chức năng). Nó giúp tách biệt hoàn toàn **Logic cập nhật trạng thái (State Logic)** ra khỏi **Giao diện hiển thị (UI/Component)**.

```mermaid
flowchart TD
    UI["Component UI (Nút bấm, Input...)"] -->|Phát ra một hành động: dispatch(action)| Reducer["Hàm Reducer<br/>(Pure Function: xử lý logic)"]
    Reducer -->|Nhận State cũ + Action → Tính ra| NewState["State mới (New State)"]
    NewState -->|Cập nhật| Store["Bộ nhớ Component"]
    Store -->|Re-render UI| UI
```

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Kiến trúc của Mô hình Reducer
Mô hình `useReducer` được cấu thành từ 4 thành phần cốt lõi:
1.  **State (Trạng thái):** Một đối tượng đại diện cho toàn bộ trạng thái hiện tại của component.
2.  **Action (Hành động):** Một JavaScript Object mô tả việc người dùng vừa làm gì. Thường có cấu trúc `{ type: string, payload?: any }`.
3.  **Dispatch (Gửi hành động):** Hàm do React cung cấp dùng để gửi (dispatch) một action vào Reducer.
4.  **Reducer (Hàm xử lý):** Một hàm thuần túy (**Pure Function**) nhận vào hai đối số: `(state, action)` và trả về một `state` mới hoàn toàn.
    $$\text{Reducer}(S_{\text{old}}, A) \rightarrow S_{\text{new}}$$

> [!IMPORTANT]
> **Tính Thuần túy của Reducer:**
> Hàm Reducer **bắt buộc phải là Pure Function**. Nó không được thực hiện bất kỳ side effect nào (như gọi API, thay đổi biến global, đọc/ghi localstorage). Reducer chỉ thực hiện các phép toán logic thuần túy trên dữ liệu đầu vào.

---

### 2. So sánh: `useState` vs `useReducer`

| Tiêu chí | `useState` | `useReducer` |
| :--- | :--- | :--- |
| **Độ phức tạp của State** | Thấp (các biến đơn lẻ, độc lập) | Cao (nhiều thuộc tính, lồng nhau, phụ thuộc chéo) |
| **Logic cập nhật** | Đơn giản, trực tiếp | Phức tạp, nhiều bước xử lý trung gian |
| **Khả năng kiểm thử (Testing)**| Khó kiểm thử độc lập (gắn liền với Component) | Rất dễ viết Unit Test vì Reducer là hàm JS thuần túy |
| **Dung lượng code ban đầu** | Ít boilerplate | Nhiều boilerplate (cần khai báo action, type, reducer) |

---

### 3. Cơ chế Khởi tạo trễ (Lazy Initialization)
Giống như `useState`, bạn có thể khởi tạo giá trị ban đầu cho `useReducer` một cách lười biếng thông qua tham số thứ 3 (hàm `init`).
```javascript
const [state, dispatch] = useReducer(reducer, initialArg, init);
```
*   Hàm `init(initialArg)` sẽ chỉ chạy **một lần duy nhất** khi component mount, thích hợp cho các tác vụ tính toán hoặc nạp cấu hình ban đầu.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Triển khai Quản lý Giỏ hàng (Shopping Cart) bằng useReducer & TypeScript
Dưới đây là một ví dụ thực tế về cách thiết kế hệ thống giỏ hàng sử dụng `useReducer` kết hợp với kỹ thuật **TypeScript Discriminated Unions** để đảm bảo tính an toàn kiểu dữ liệu tuyệt đối cho các Actions.

```tsx
// File: src/components/CartManager.tsx
import React, { useReducer } from 'react';

// 1. Định nghĩa cấu trúc State
interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
}

// 2. Định nghĩa các kiểu Action sử dụng Discriminated Unions
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

// 3. Khởi tạo trạng thái mặc định ban đầu
const initialCartState: CartState = {
  items: [],
  totalAmount: 0
};

// Hàm phụ trợ tính tổng tiền
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

// 4. Định nghĩa hàm Reducer thuần túy
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      let updatedItems = [...state.items];

      if (existingItemIndex > -1) {
        // Nếu đã có item trong giỏ, tăng số lượng lên 1
        const existingItem = state.items[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1
        };
      } else {
        // Nếu chưa có, thêm mới với số lượng là 1
        updatedItems.push({ ...action.payload, quantity: 1 });
      }

      return {
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems)
      };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload.id);
      return {
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems)
      };
    }

    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          return { ...item, quantity: Math.max(1, action.payload.quantity) };
        }
        return item;
      });

      return {
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems)
      };
    }

    case 'CLEAR_CART':
      return initialCartState;

    default:
      return state;
  }
};

// 5. Component giao diện người dùng
export const CartManager: React.FC = () => {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const handleAddDemoItem = () => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { id: 'p1', name: 'Sách học TypeScript', price: 150000 }
    });
  };

  return (
    <div className="cart-container">
      <h2>Giỏ hàng của bạn</h2>
      <button onClick={handleAddDemoItem}>Thêm Sách học TS</button>
      <button onClick={() => dispatch({ type: 'CLEAR_CART' })}>Xóa toàn bộ giỏ</button>

      <ul>
        {state.items.map(item => (
          <li key={item.id}>
            <span>{item.name} - {item.price}đ x {item.quantity}</span>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => dispatch({
                type: 'UPDATE_QUANTITY',
                payload: { id: item.id, quantity: Number(e.target.value) }
              })}
            />
            <button onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } })}>
              Xóa
            </button>
          </li>
        ))}
      </ul>

      <h3>Tổng số tiền: {state.totalAmount}đ</h3>
    </div>
  );
};
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & BEST PRACTICES)

### 1. Vi phạm tính bất biến của State (Direct Mutation)
*   **Lỗi thường gặp:** Thay đổi các phần tử của state trực tiếp bên trong Reducer trước khi return.
*   ❌ *Anti-pattern:*
    ```typescript
    case 'ADD_ITEM':
      state.items.push(action.payload); // ❌ Mutate trực tiếp mảng cũ!
      return state;
    ```
*   **Hậu quả:** React so sánh tham chiếu thấy state cũ và mới là một, dẫn đến không kích hoạt re-render. Luôn nhớ sử dụng cú pháp spread `[...state.items]` hoặc hàm sao chép để trả về vùng nhớ mới.

### 2. Thực hiện Side Effect bên trong Reducer
*   Không được đặt các hàm gọi API, ghi log Firebase, hoặc thay đổi localStorage bên trong switch-case của Reducer. Nếu cần làm các việc đó, hãy thực hiện ở Event Handler trước khi gọi `dispatch`, hoặc lắng nghe sự thay đổi của state trong `useEffect`.

---

## 💡 5 QUY TẮC VÀNG KHI DÙNG USEREDUCER
1.  **Reducer phải là Pure Function:** Chỉ nhận dữ liệu cũ, thực hiện phép toán logic và trả về dữ liệu mới. Tuyệt đối không thay đổi môi trường bên ngoài.
2.  **Định nghĩa Action rõ ràng:** Sử dụng TypeScript Discriminated Unions để kiểm soát chặt chẽ cấu trúc `type` và `payload` của từng Action.
3.  **Tập trung hóa logic cập nhật:** Đưa toàn bộ các phép toán xử lý dữ liệu vào Reducer. Event handler ở UI chỉ làm nhiệm vụ duy nhất là gửi `dispatch(action)`.
4.  **Tạo bản sao sâu (Deep Copy) khi cập nhật Object phức tạp:** Sử dụng các thư viện như `Immer` để viết code cập nhật ngắn gọn nếu cấu trúc State lồng quá nhiều tầng.
5.  **Không dùng useReducer cho mọi thứ:** Giữ nguyên `useState` cho các state cục bộ, đơn giản (như bật/tắt Modal, giá trị ô Input) để giữ cho code nhẹ nhàng và dễ đọc.
