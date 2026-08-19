# Bài 08 - Lists, Keys & Conditional Rendering (Danh sách, Key & Render có điều kiện)

## I. KHÁI QUÁT (OVERVIEW)

### 1. Bản chất của việc Render danh sách trong React
Trong React, không có cú pháp vòng lặp đặc biệt nào (như `v-for` trong Vue hay `*ngFor` trong Angular). React tận dụng sức mạnh thuần túy của JavaScript để xử lý mảng phần tử, phổ biến nhất là thông qua phương thức `map()`.

*   **Mục tiêu của React:** Chuyển đổi một mảng dữ liệu (data array) thành một mảng các đối tượng Virtual DOM đại diện cho các node UI tương ứng.

```mermaid
flowchart LR
    DataArray["Mảng dữ liệu: [Data 1, Data 2]"] -->|map()| ElementArray["Mảng React Elements: [<Card key='1'/>, <Card key='2'/>]"]
    ElementArray -->|Render| VDOM["Virtual DOM Tree"]
```

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Tại sao thuộc tính `key` lại bắt buộc và cực kỳ quan trọng?
Khi một danh sách dữ liệu thay đổi (ví dụ: một phần tử bị xóa, một phần tử mới được chèn vào giữa, hoặc danh sách được sắp xếp lại), React cần xác định chính xác phần tử Virtual DOM nào tương ứng với DOM node thực tế nào của trình duyệt.
Quá trình này được gọi là **Reconciliation** (Đối chiếu).

#### Cơ chế hoạt động của `key`:
*   `key` là một chuỗi ký tự hoặc số duy nhất giúp định danh cho mỗi phần tử trong danh sách.
*   Khi re-render, React sử dụng thuộc tính `key` làm nhãn tham chiếu. Nó so sánh các key của danh sách mới với danh sách cũ để đưa ra quyết định tối ưu nhất:
    *   **Giữ nguyên (Retain):** Nếu key xuất hiện ở cả hai danh sách $\rightarrow$ Giữ lại DOM node cũ, chỉ cập nhật các thuộc tính thay đổi (nếu có).
    *   **Tạo mới (Create):** Nếu key mới chưa từng xuất hiện $\rightarrow$ Tạo mới DOM node.
    *   **Hủy bỏ (Destroy):** Nếu key cũ không xuất hiện trong danh sách mới $\rightarrow$ Xóa bỏ DOM node.

---

### 2. Các cạm bẫy khi chọn giá trị cho `key`

#### a. Sử dụng chỉ số mảng (`index`) làm key
Đây là lỗi kinh điển nhất của người mới học. Trình duyệt sẽ đưa ra cảnh báo lỗi nếu thiếu key, và giải pháp lười biếng thường là dùng `index` của hàm `map()`.
*   **Hậu quả:** Khi danh sách có sự thay đổi về mặt thứ tự (thêm vào đầu, xóa ở giữa, sắp xếp lại), chỉ số `index` của các phần tử sẽ bị gán lại từ đầu. React sẽ nhận diện sai lệch phần tử cũ/mới, dẫn đến:
    1.  Hiển thị sai trạng thái nội bộ của các ô input (gõ nhầm cột).
    2.  Hiệu năng cực kỳ tệ vì React phải phá hủy và dựng lại toàn bộ các DOM node thay vì tái sử dụng chúng.

#### b. Sử dụng giá trị ngẫu nhiên (`Math.random()`) làm key
*   **Hậu quả:** Mỗi lần component re-render, toàn bộ các phần tử trong danh sách sẽ nhận được một key hoàn toàn mới.
*   React sẽ nghĩ rằng đây là danh sách mới tinh, tiến hành hủy toàn bộ các DOM node cũ và render lại từ đầu $\rightarrow$ Gây giật lag nghiêm trọng, mất toàn bộ focus của chuột.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Triển khai Render danh sách động với Key chuẩn xác
Dưới đây là một ví dụ thực tế về danh sách Task Manager cho phép thêm, xóa và sắp xếp thứ tự công việc.

```tsx
// File: src/components/TaskManager.tsx
import React, { useState } from 'react';

interface Task {
  id: string; // ID độc nhất không đổi
  title: string;
  isCompleted: boolean;
}

export const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 't1', title: 'Học React Core', isCompleted: false },
    { id: 't2', title: 'Học Tailwind CSS', isCompleted: true }
  ]);

  const addTaskAtStart = () => {
    const newTask: Task = {
      id: `task_${Date.now()}`, // Tạo ID độc nhất dựa trên timestamp
      title: `Task mới tạo vào lúc ${new Date().toLocaleTimeString()}`,
      isCompleted: false
    };
    // Chèn vào ĐẦU mảng
    setTasks([newTask, ...tasks]);
  };

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <div className="task-manager">
      <button onClick={addTaskAtStart}>Thêm Task vào đầu</button>
      
      {/* 
        ✅ BEST PRACTICE: Sử dụng id độc nhất làm key.
        Dù danh sách bị chèn thêm vào đầu, React vẫn nhận diện chính xác 
        các phần tử cũ dựa vào key 't1', 't2' và chỉ chèn thêm DOM node mới cho phần tử đầu tiên.
      */}
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className={task.isCompleted ? 'completed' : ''}>
            <span>{task.title}</span>
            <button onClick={() => removeTask(task.id)}>Xóa</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

### 2. Các mẫu thiết kế Render có điều kiện (Conditional Rendering Patterns)

#### a. Mẫu Early Return (Trả về sớm)
Sử dụng khi bạn muốn render ra một giao diện hoàn toàn khác (ví dụ: màn hình Loading, thông báo Lỗi) dựa trên điều kiện nhất định.

```tsx
// File: src/components/UserDashboard.tsx
import React from 'react';

interface DashboardProps {
  isLoading: boolean;
  error: string | null;
  data: string[] | null;
}

export const UserDashboard: React.FC<DashboardProps> = ({ isLoading, error, data }) => {
  // 1. Phân nhánh Early Return cho trạng thái tải
  if (isLoading) {
    return <div className="spinner">Đang tải dữ liệu hệ thống...</div>;
  }

  // 2. Phân nhánh Early Return cho trạng thái lỗi
  if (error) {
    return <div className="error-banner">Lỗi: {error}</div>;
  }

  // 3. Phân nhánh Early Return khi không có dữ liệu
  if (!data || data.length === 0) {
    return <div className="empty-state">Không có nội dung hiển thị.</div>;
  }

  // 4. Luồng render chính khi mọi dữ liệu đều hợp lệ
  return (
    <div className="dashboard-content">
      <h2>Dữ liệu hoạt động</h2>
      <ul>
        {data.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    </div>
  );
};
```

#### b. Ẩn hoàn toàn phần tử bằng cách trả về `null`
Nếu muốn một Component hoàn toàn không hiển thị gì cả (không tạo ra bất kỳ thẻ HTML nào trên DOM), hãy trả về `null`.
```tsx
const Alert = ({ show }: { show: boolean }) => {
  if (!show) return null; // Trả về null để ẩn hoàn toàn khỏi cây DOM
  return <div className="alert-box">Thông báo khẩn cấp!</div>;
};
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & BEST PRACTICES)

### 1. Phép so sánh nông khi render danh sách chứa React Component con
*   Nếu bạn truyền một React Component làm phần tử danh sách (ví dụ: `<TaskItem key={task.id} {...task} />`), và Component con đó sử dụng `React.memo` để tối ưu hiệu năng:
*   Đảm bảo `key` luôn nằm trực tiếp trên thẻ gọi component con ở danh sách cha, chứ không phải nằm bên trong Component con đó.
*   *Đúng:* `tasks.map(task => <TaskItem key={task.id} />)`
*   *Sai:* `const TaskItem = () => <li key={...}>` (Viết key ở trong Component con là vô tác dụng đối với cơ chế Diffing của cha).

---

## 💡 5 QUY TẮC VÀNG VỀ RENDER DANH SÁCH & ĐIỀU KIỆN
1.  **Chỉ dùng index làm key khi dữ liệu tĩnh:** Chỉ sử dụng chỉ số index của mảng làm key khi và chỉ khi danh sách đó là tĩnh hoàn toàn (không bao giờ thêm, xóa, sắp xếp hoặc lọc dữ liệu).
2.  **Đặt vị trí key chuẩn xác:** Key luôn phải nằm ở thẻ/Component ngoài cùng được trả về trực tiếp từ hàm `map()`.
3.  **Tránh inline logic phức tạp:** Hạn chế viết các toán tử ba ngôi lồng nhau quá nhiều tầng bên trong JSX. Hãy chuyển sang cấu trúc hàm hoặc dùng Early Return ngoài phần return chính.
4.  **Ép kiểu boolean tường minh cho toán tử `&&`:** Luôn viết `!!list.length && <Component />` hoặc `list.length > 0 && <Component />` để tránh bị hiển thị số 0 ngoài ý muốn trên màn hình.
5.  **Dùng ID duy nhất từ nguồn cấp dữ liệu:** Luôn ưu tiên sử dụng ID sinh ra từ cơ sở dữ liệu làm key để đảm bảo tính nhất quán tối đa qua các lần đồng bộ dữ liệu.
