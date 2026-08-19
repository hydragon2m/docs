## I. KHÁI QUÁT (OVERVIEW)

### 1. Component và Props là gì?
**Component** (Thành phần) và **Props** (Thuộc tính) là hai khái niệm nền tảng trong mô hình lập trình khai báo của React. Chúng hoạt động dựa trên triết lý **Pure Functions** (Hàm thuần túy) của lập trình chức năng.

*   **Component:** Đóng vai trò như các khối gạch xây dựng nên UI. Bạn định nghĩa một Component dưới dạng một hàm nhận dữ liệu đầu vào và trả về một khối JSX.
*   **Props:** Viết tắt của *Properties*, là đối tượng chứa toàn bộ dữ liệu đầu vào được truyền từ Component cha xuống Component con.

```mermaid
flowchart TD
    Parent["Component Cha (Parent)"] -->|Truyền Props: <br/> title='Bài viết', count={10}| Child["Component Con (Child)"]
    Child -->|Đọc Props| Logic["Xử lý & Render JSX"]
    Note["Props là READ-ONLY<br/>Không được thay đổi trực tiếp ở con"] -.-> Child
```

> [!IMPORTANT]
> **Hợp đồng Bất biến (Immutability Contract):**
> Tất cả các React Component phải hoạt động như những hàm thuần túy đối với các Props của chúng. Component con **tuyệt đối không được sửa đổi** bất kỳ giá trị nào của Props được truyền vào từ cha.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Cơ chế hoạt động của Props trong Bộ nhớ
Khi một component re-render, Component cha sẽ tính toán các giá trị props mới và truyền nó xuống.
*   **Tham trị (Primitives):** Các props kiểu dữ liệu cơ bản như `string`, `number`, `boolean` sẽ được so sánh bằng giá trị.
*   **Tham chiếu (Objects/Arrays/Functions):** Các props kiểu dữ liệu phức tạp sẽ được so sánh bằng địa chỉ vùng nhớ. 

> [!WARNING]
> **Hiệu ứng Re-render không mong muốn do Tham chiếu:**
> Nếu bạn truyền một hàm ẩn danh hoặc một object literal trực tiếp vào props:
> `<Button onClick={() => console.log('Click')} />`
> Mỗi lần component cha render, một hàm mới với địa chỉ bộ nhớ mới sẽ được tạo ra. Trình duyệt coi đây là prop mới và ép buộc Component con phải re-render lại, bất kể nội dung hàm không hề thay đổi.

---

### 2. Thuộc tính đặc biệt: `children` prop
`children` là một prop đặc biệt được React tự động gán cho phần nội dung nằm giữa thẻ đóng và thẻ mở của một Component khi gọi nó.

#### Ví dụ cơ chế hoạt động:
```tsx
// Định nghĩa một Layout Card
const Card = ({ children }: { children: React.ReactNode }) => {
  return <div className="card-container">{children}</div>;
};

// Cách gọi bên ngoài:
const App = () => {
  return (
    <Card>
      <h2>Tiêu đề Card</h2>
      <p>Nội dung chi tiết nằm bên trong Card.</p>
    </Card>
  );
};
```
👉 Toàn bộ khối thẻ `<h2>` và `<p>` ở trên sẽ được React gộp vào thuộc tính `props.children` và render bên trong thẻ `div` của `Card`. Kỹ thuật này được gọi là **Composition (Tập hợp thành phần)**.

---

### 3. Thành phần cấu hợp (Composition) vs Kế thừa (Inheritance)
Trong lập trình hướng đối tượng (OOP), chúng ta thường dùng kế thừa (Inheritance) để tái sử dụng mã nguồn. Tuy nhiên, React khuyến nghị sử dụng **Composition** để liên kết các Component với nhau.
*   **Kế thừa (Inheritance):** Thiết lập mối quan hệ *is-a* (Ví dụ: `AdminUser` kế thừa từ `User`).
*   **Cấu hợp (Composition):** Thiết lập mối quan hệ *has-a* (Ví dụ: `Page` chứa một `Sidebar`, `Sidebar` chứa một `Menu`). Kỹ thuật này linh hoạt hơn, tránh việc tạo ra các cây kế thừa sâu và khó bảo trì.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Triển khai Type-safe Components & Props bằng TypeScript

Dưới đây là một ví dụ chuẩn chỉnh về cách định nghĩa kiểu dữ liệu cho Props bằng TypeScript Interface, destructuring và xử lý giá trị mặc định (default props).

```tsx
// File: src/components/UserProfileCard.tsx
import React from 'react';

// 1. Định nghĩa Interface cho các Props đầu vào
interface UserProfileCardProps {
  username: string;
  email: string;
  age?: number; // Thuộc tính tùy chọn (optional)
  isActive?: boolean; // Thuộc tính tùy chọn
  onStatusChange?: (status: boolean) => void; // Prop là một hàm callback
  children?: React.ReactNode; // Nội dung bổ sung tùy chọn
}

// 2. Định nghĩa Component sử dụng kiểu React.FC và gán giá trị mặc định cho Props
export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  username,
  email,
  age = 18, // Gán giá trị mặc định thông qua ES6 Destructuring
  isActive = false,
  onStatusChange,
  children
}) => {
  
  const handleToggle = () => {
    if (onStatusChange) {
      onStatusChange(!isActive);
    }
  };

  return (
    <div className={`user-card ${isActive ? 'active' : 'inactive'}`}>
      <h3>{username}</h3>
      <p>Email: {email}</p>
      <p>Tuổi: {age}</p>
      
      <button onClick={handleToggle}>
        {isActive ? 'Khóa tài khoản' : 'Kích hoạt'}
      </button>

      {/* Render children nếu có */}
      {children && <div className="card-extra-content">{children}</div>}
    </div>
  );
};
```

#### Phân tích các kỹ thuật áp dụng:
1.  **Destructuring Props:** Thay vì gọi `props.username`, việc sử dụng cú pháp destructuring `{ username, email }` ngay ở tham số của hàm giúp code ngắn gọn và sạch sẽ hơn.
2.  **Default Value:** Đặt giá trị mặc định bằng cú pháp ES6 `= 18` trực tiếp trong destructuring là cách làm chuẩn hiện đại, thay thế cho cách khai báo `UserProfileCard.defaultProps` kiểu cũ (đã bị React 19 loại bỏ hoàn toàn đối với function components).
3.  **Hàm Callback (Event Up):** Khi người dùng tương tác (click nút), Component con không tự thay đổi trạng thái của mình mà gọi hàm callback `onStatusChange` nhận từ cha để báo cho Component cha thay đổi state. Quy trình này tuân thủ nguyên lý **One-way Data Binding** (Dữ liệu chảy một chiều từ trên xuống dưới).

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & BEST PRACTICES)

### 1. Cố tình thay đổi giá trị của Props (Props Mutation)
*   **Hành vi nguy hiểm:** Thay đổi trực tiếp giá trị của props bên trong Component con.
*   ❌ *Anti-pattern:*
    ```tsx
    const User = (props) => {
      props.username = 'Thay đổi tên'; // ❌ Gây lỗi hoặc hành vi không kiểm soát
      return <div>{props.username}</div>
    }
    ```
*   **Giải thích:** React dựa trên cơ chế so sánh tham chiếu để quyết định re-render. Việc thay đổi trực tiếp props làm phá vỡ tính thuần túy của hàm và khiến React không thể theo dõi chính xác dòng dữ liệu.
*   ✅ *Best practice:* Nếu cần thay đổi giá trị, hãy lưu trữ nó vào `State` ở Component cha và truyền hàm thay đổi state (`setState`) xuống cho con thông qua props.

### 2. Truyền thừa Props không sử dụng (Over-propping)
*   Không nên truyền quá nhiều props dư thừa vào Component con. Điều này làm tăng độ phức tạp khi bảo trì và tăng nguy cơ gây re-render không cần thiết khi các props thừa đó thay đổi.

---

## 💡 5 QUY TẮC VÀNG VỀ COMPONENT & PROPS
1.  **Props là bất biến:** Tuyệt đối không thay đổi, gán lại giá trị cho props ở Component con.
2.  **Đặt tên Component chuẩn PascalCase:** Luôn viết hoa chữ cái đầu tiên của tên Component để phân biệt với thẻ HTML thông thường.
3.  **Tách cấu trúc props một cách tường minh:** Ưu tiên sử dụng cú pháp Destructuring và gán giá trị mặc định (default values) ngay tại danh sách tham số của hàm component.
4.  **Đặt kiểu dữ liệu chặt chẽ cho Props:** Luôn sử dụng TypeScript Interface để mô tả kiểu của props, giúp phát hiện lỗi gán sai dữ liệu ngay trong quá trình viết code (compile-time).
5.  **Dữ liệu đi xuống, Sự kiện đi lên (Data down, Events up):** Component cha truyền dữ liệu xuống con qua props, con muốn thay đổi dữ liệu phải gửi tín hiệu lên cha qua các callback functions.
