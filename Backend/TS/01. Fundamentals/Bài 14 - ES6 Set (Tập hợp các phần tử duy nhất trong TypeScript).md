## I. KHÁI QUÁT (OVERVIEW)

Trong phát triển ứng dụng Backend, chúng ta thường xuyên đối mặt với bài toán lưu giữ các danh sách phần tử không được phép trùng lặp (ví dụ: danh sách ID của các socket đang kết nối, tập hợp các tag gán cho bài viết, danh sách vai trò người dùng). 

Nếu sử dụng **Array** thông thường, mỗi khi thêm một phần tử mới, chúng ta phải viết logic kiểm tra thủ công bằng `.includes()` hoặc `.indexOf()` với độ phức tạp hiệu năng tăng dần theo số lượng phần tử:
*   Mỗi lần thêm phần tử có độ phức tạp: $O(N)$
*   Lọc trùng lặp mảng tốn: $O(N^2)$

**`Set`** được ES6 giới thiệu là cấu trúc tập hợp các phần tử **duy nhất** (Unique values). Việc chèn phần tử mới và kiểm tra sự tồn tại trong `Set` được tối ưu hóa sâu trong engine V8 với độ phức tạp gần như là hằng số: **$O(1)$**.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Cú pháp Khai báo kiểu (Type Annotation)
Trong TypeScript, `Set` sử dụng kiểu dữ liệu Generic với một tham số `T` đại diện cho kiểu dữ liệu của các phần tử bên trong.

```typescript
// 1. Khai báo Set trống lưu trữ các userId dạng string
const loggedInUsers = new Set<string>();

// 2. Khai báo kèm khởi tạo từ một Array
const userRoles = new Set<string>(["admin", "editor", "viewer"]);
```

### 2. Các phương thức Core API của Set

```typescript
const uniqueTags = new Set<string>();

// 1. Thêm phần tử (.add)
// Nếu phần tử đã tồn tại, Set sẽ tự động bỏ qua mà không báo lỗi
uniqueTags.add("nodejs");
uniqueTags.add("typescript");
uniqueTags.add("nodejs"); // Bị bỏ qua vì 'nodejs' đã tồn tại

// 2. Kiểm tra sự tồn tại (.has) - Tốc độ cực nhanh O(1)
if (uniqueTags.has("typescript")) {
  console.log("Thẻ 'typescript' hợp lệ!");
}

// 3. Xóa một phần tử (.delete)
uniqueTags.delete("nodejs"); // Trả về true nếu xóa thành công

// 4. Lấy tổng số phần tử duy nhất (.size)
console.log(uniqueTags.size); // Kết quả: 1

// 5. Xóa sạch Set (.clear)
uniqueTags.clear();
```

### 3. Duyệt phần tử trong Set (Set Iteration)
`Set` cũng là một Iterable mặc định và lưu trữ các phần tử theo thứ tự chèn (Insertion Order).

```typescript
const tools = new Set<string>(["Docker", "Nginx", "Git"]);

// Duyệt qua Set bằng vòng lặp for...of
for (const tool of tools) {
  console.log(`Công cụ: ${tool}`);
}

// Duyệt qua Set sử dụng .forEach
tools.forEach((value) => {
  console.log(`Value: ${value}`);
});
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Loại bỏ trùng lặp mảng (Array Deduplication) trong TypeScript
Đây là mẹo kinh điển và tối ưu nhất để lọc các phần tử trùng lặp trong một Array:

```typescript
// Lọc mảng số nguyên trùng lặp
const numbers = [1, 2, 2, 3, 4, 4, 5, 1];
const uniqueNumbers = [...new Set<number>(numbers)];
console.log(uniqueNumbers); // Output: [1, 2, 3, 4, 5]

// Lọc mảng string trùng lặp
const categories = ["tech", "life", "tech", "money", "life"];
const uniqueCategories = Array.from(new Set<string>(categories));
console.log(uniqueCategories); // Output: ['tech', 'life', 'money']
```

### 2. Quản lý danh sách kết nối WebSocket (Active Connections)
Trong các ứng dụng real-time, chúng ta cần theo dõi danh sách socket ID đang hoạt động và gửi thông báo nhanh:

```typescript
class SocketManager {
  // Tập hợp các socketId duy nhất đang kết nối
  private activeSockets = new Set<string>();

  connectSocket(socketId: string): void {
    this.activeSockets.add(socketId);
    console.log(`Socket ${socketId} connected. Total: ${this.activeSockets.size}`);
  }

  disconnectSocket(socketId: string): void {
    this.activeSockets.delete(socketId);
    console.log(`Socket ${socketId} disconnected. Total: ${this.activeSockets.size}`);
  }

  broadcast(message: string, sendFn: (id: string, msg: string) => void): void {
    for (const socketId of this.activeSockets) {
      sendFn(socketId, message);
    }
  }
}
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & CORE RULES)

### 1. Cạm bẫy So sánh Tham chiếu của Object trong Set
Tương tự như `Map`, nếu bạn thêm các đối tượng (Objects) vào `Set`, nó sẽ phân biệt dựa trên **địa chỉ vùng nhớ** chứ không phải giá trị thuộc tính bên trong đối tượng.

```typescript
const userSet = new Set<object>();

userSet.add({ id: 101, role: "admin" });
userSet.add({ id: 101, role: "admin" });

console.log(userSet.size); // Kết quả: 2 ❌
```
> [!WARNING]
> **Giải thích:** Hai literal objects được khởi tạo ở hai ô nhớ hoàn toàn khác nhau nên `Set` coi chúng là hai thực thể độc lập và nhận cả hai.
> 
> **Quy tắc:** Chỉ sử dụng kiểu nguyên thủy (primitive types) như `string`, `number` làm phần tử cho `Set` nếu bạn không thể kiểm soát tham chiếu của các đối tượng Key.

### 2. So sánh Array vs Set

| Tiêu chí | Array | Set |
| :--- | :--- | :--- |
| **Trùng lặp phần tử** | Cho phép trùng lặp thoải mái | Tự động từ chối phần tử trùng lặp |
| **Thứ tự phần tử** | Theo chỉ mục Index (0, 1, 2...) | Theo thứ tự chèn (Insertion Order) |
| **Truy cập phần tử** | Cực nhanh qua chỉ mục `arr[index]` | Không hỗ trợ truy cập qua index (phải duyệt qua) |
| **Độ phức tạp kiểm tra (.has vs .includes)** | Chậm: $O(N)$ (phải quét qua toàn bộ mảng) | Cực nhanh: $O(1)$ (sử dụng hash-table lookup) |

---

## 💡 5 QUY TẮC VÀNG KHI SỬ DỤNG SET
1.  **Dùng Set để lọc trùng lặp mảng:** Luôn tận dụng cú pháp `[...new Set(array)]` để làm sạch mảng dữ liệu.
2.  **Sử dụng Set thay vì Array khi cần kiểm tra sự tồn tại liên tục:** Nếu ứng dụng của bạn liên tục phải gọi `.includes()` để kiểm tra xem một ID hoặc cờ có tồn tại trong danh sách hay không, hãy chuyển danh sách đó sang `Set` và dùng `.has()` để đạt hiệu năng tối đa.
3.  **Khai báo kiểu Generic rõ ràng:** Luôn định nghĩa `new Set<T>()` để TypeScript bảo vệ và ngăn chặn việc chèn sai kiểu dữ liệu vào tập hợp.
4.  **Tránh nhét Object vô danh vào Set:** Hạn chế tối đa việc nhét các đối tượng literal không có biến tham chiếu cố định vào `Set` để tránh rò rỉ và trùng lặp dữ liệu ô nhớ.
5.  **Duyệt Set tối giản:** Sử dụng vòng lặp `for (const item of set)` để mã nguồn trực quan, dễ bảo trì.
