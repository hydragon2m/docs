## I. KHÁI QUÁT (OVERVIEW)

Trong lập trình JavaScript/TypeScript truyền thống, chúng ta thường lạm dụng **Object** làm cấu trúc dữ liệu bản đồ (Key-Value). Tuy nhiên, Object có những giới hạn vật lý nghiêm trọng:
1.  **Chỉ chấp nhận Key kiểu String hoặc Symbol:** Mọi kiểu dữ liệu khác khi làm Key đều bị ép kiểu (stringify) về dạng chuỗi.
2.  **Không tối ưu cho việc ghi/xóa liên tục:** Bộ máy tối ưu (V8 Engine) của trình duyệt phải thay đổi cấu trúc Class ẩn (Hidden Class) của Object mỗi khi thêm/xóa thuộc tính.
3.  **Khó xác định kích thước:** Bạn phải tính toán thủ công thông qua `Object.keys(obj).length` với độ phức tạp $O(N)$.

Để giải quyết triệt để các vấn đề này, ES6 đã giới thiệu cấu trúc **`Map`** - một cấu trúc dữ liệu bản đồ Key-Value chuyên dụng, hỗ trợ mọi kiểu dữ liệu làm Key và được TypeScript hỗ trợ kiểm soát kiểu Generic `Map<K, V>` cực kỳ mạnh mẽ.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Cú pháp Khai báo kiểu (Type Annotation)
Trong TypeScript, `Map` sử dụng kiểu dữ liệu Generic với hai tham số: `K` đại diện cho kiểu của Key và `V` đại diện cho kiểu của Value.

```typescript
// 1. Khai báo Map trống
const userCache = new Map<string, { name: string; email: string }>();

// 2. Khai báo kèm khởi tạo giá trị ban đầu (dùng mảng 2 chiều [Key, Value])
const countryCodes = new Map<number, string>([
  [84, "Vietnam"],
  [1, "USA"],
  [81, "Japan"]
]);
```

### 2. Các phương thức Core API của Map
TypeScript hỗ trợ tự động gợi ý code (Autocomplete) cho toàn bộ API chuẩn của Map:

```typescript
interface DeviceInfo {
  model: string;
  os: "iOS" | "Android";
}

const activeDevices = new Map<string, DeviceInfo>();

// 1. Thêm hoặc cập nhật phần tử (.set)
activeDevices.set("device-001", { model: "iPhone 15", os: "iOS" });
activeDevices.set("device-002", { model: "Galaxy S24", os: "Android" });

// 2. Đọc giá trị (.get)
const device = activeDevices.get("device-001"); 
// TypeScript tự động suy luận kiểu của 'device' là: DeviceInfo | undefined

// 3. Kiểm tra sự tồn tại của Key (.has)
if (activeDevices.has("device-002")) {
  console.log("Thiết bị đang hoạt động!");
}

// 4. Xóa phần tử theo Key (.delete)
activeDevices.delete("device-001"); // Trả về true nếu xóa thành công

// 5. Đọc kích thước của Map (.size)
console.log(activeDevices.size); // Kết quả: 1

// 6. Xóa sạch Map (.clear)
activeDevices.clear();
```

### 3. Duyệt phần tử trong Map (Map Iteration)
`Map` là một đối tượng duyệt được (Iterable) mặc định. Thứ tự của các phần tử khi duyệt luôn khớp chính xác với thứ tự mà chúng được thêm vào Map (Insertion Order).

```typescript
const roles = new Map<string, string>([
  ["admin", "Toàn quyền hệ thống"],
  ["editor", "Quản lý bài viết"],
  ["viewer", "Chỉ đọc dữ liệu"]
]);

// A. Duyệt cả Key và Value sử dụng destructuring
for (const [roleName, description] of roles) {
  console.log(`${roleName}: ${description}`);
}

// B. Chỉ duyệt qua các Key (.keys())
for (const role of roles.keys()) {
  console.log(`Role: ${role}`);
}

// C. Chỉ duyệt qua các Value (.values())
for (const desc of roles.values()) {
  console.log(`Mô tả: ${desc}`);
}
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Sử dụng Map làm Bộ đệm Cache với Key kiểu Object phức tạp
Một trong những điểm mạnh nhất của `Map` là khả năng dùng chính đối tượng (Object) làm Key. Dưới đây là ví dụ về bộ đệm lưu kết quả tính toán độ ưu tiên của Connection Socket:

```typescript
interface SocketConnection {
  socketId: string;
  ip: string;
}

interface ConnectionPriority {
  level: "HIGH" | "MEDIUM" | "LOW";
  calculatedAt: Date;
}

class PriorityCache {
  // Key là SocketConnection (Object), Value là ConnectionPriority
  private store = new Map<SocketConnection, ConnectionPriority>();

  setPriority(conn: SocketConnection, priority: ConnectionPriority): void {
    this.store.set(conn, priority);
  }

  getPriority(conn: SocketConnection): ConnectionPriority | undefined {
    return this.store.get(conn);
  }
}

const cache = new PriorityCache();
const socketA: SocketConnection = { socketId: "s-101", ip: "192.168.1.1" };

cache.setPriority(socketA, { level: "HIGH", calculatedAt: new Date() });
console.log(cache.getPriority(socketA)); // Output: { level: 'HIGH', ... }
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & CORE RULES)

### 1. Cạm bẫy So sánh Tham chiếu của Object Key (Reference Equality)
TypeScript/JavaScript so sánh các Object Key trong Map dựa trên **địa chỉ ô nhớ (Reference)** chứ không phải dựa trên cấu trúc thuộc tính của Object đó.

```typescript
const map = new Map<object, string>();

// Đăng ký key bằng literal object
map.set({ id: 1 }, "Dữ liệu người dùng A");

// Cố gắng đọc lại bằng một literal object có cấu trúc tương đương
console.log(map.get({ id: 1 })); // Kết quả: undefined ❌
```

> [!WARNING]
> **Giải thích:** Hai đối tượng `{ id: 1 }` ở dòng `.set` và dòng `.get` được cấp phát ở hai vùng nhớ khác nhau. `Map` so sánh `Key1 === Key2` và thấy chúng khác nhau, do đó trả về `undefined`.
> 
> **Quy tắc:** Bắt buộc phải giữ tham chiếu của Object Key qua một biến cố định:
> ```typescript
> const userKey = { id: 1 };
> map.set(userKey, "Dữ liệu người dùng A");
> console.log(map.get(userKey)); // "Dữ liệu người dùng A" ✅
> ```

### 2. Khi nào chọn Object vs Map?

| Tiêu chí | Object | Map |
| :--- | :--- | :--- |
| **Kiểu của Key** | Chỉ String hoặc Symbol | Mọi kiểu dữ liệu (Object, Function, Array) |
| **Thứ tự phần tử** | Không đảm bảo thứ tự chèn | Đảm bảo đúng thứ tự chèn |
| **Hiệu năng ghi/xóa** | Chậm hơn đối với dữ liệu lớn | Rất nhanh, tối ưu cho việc sửa đổi liên tục |
| **Duyệt phần tử** | Phải chuyển qua `Object.keys()` | Duyệt trực tiếp bằng `for...of` hoặc `.forEach()` |
| **Thao tác JSON** | Hỗ trợ serialization trực tiếp (`JSON.stringify`) | Không hỗ trợ trực tiếp (phải tự convert về Array/Object) |

---

## 💡 5 QUY TẮC VÀNG KHI SỬ DỤNG MAP
1.  **Ưu tiên dùng Map cho bộ đệm Cache động:** Khi dữ liệu Key-Value thay đổi liên tục, hãy dùng `Map` để tối ưu hóa hiệu năng.
2.  **Luôn khai báo kiểu Generic tường minh:** Khai báo kiểu `new Map<K, V>()` để nhận được sự hỗ trợ check type chặt chẽ nhất từ TypeScript Compiler.
3.  **Tránh dùng Object làm Key nếu không giữ được tham chiếu:** Nếu không thể kiểm soát địa chỉ vùng nhớ của Object Key, hãy chuyển sang dùng ID kiểu `string` hoặc `number` làm Key.
4.  **Chuyển đổi sang JSON khi cần truyền tải:** Để gửi Map qua API, hãy convert nó về dạng Object phẳng hoặc mảng 2 chiều:
    ```typescript
    const jsonString = JSON.stringify(Object.fromEntries(myMap));
    ```
5.  **Duyệt Map an toàn:** Tận dụng cú pháp destructuring `for (const [key, value] of map)` giúp code sạch sẽ và tường minh nhất.
