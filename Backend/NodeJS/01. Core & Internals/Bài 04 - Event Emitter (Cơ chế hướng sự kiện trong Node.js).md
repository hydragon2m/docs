## I. KHÁI QUÁT (OVERVIEW)

### 1. Kiến trúc hướng sự kiện (Event-driven Architecture)
Node.js được thiết kế theo mô hình hướng sự kiện. Có nghĩa là phần lớn các hoạt động của hệ thống (như nhận kết nối HTTP, đọc xong một khối dữ liệu từ file, hoặc xảy ra lỗi kết nối Database) đều được điều phối bằng cách phát ra (emit) và lắng nghe (listen) các **sự kiện (events)**.

Trái tim của cơ chế này là class **`EventEmitter`** thuộc mô-đun tích hợp sẵn `events`. Đây là một hiện thực hoàn hảo của mẫu thiết kế **Observer Pattern** trong công nghệ phần mềm.

---

### 2. Nguyên lý hoạt động
Một đối tượng kế thừa `EventEmitter` sẽ duy trì một danh sách nội bộ chứa các hàm lắng nghe (listeners) tương ứng với từng tên sự kiện. 
* Khi sự kiện được **phát ra (emit)**, tất cả các hàm listener đã đăng ký với sự kiện đó sẽ lần lượt được thực thi.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Các phương thức cốt lõi của `EventEmitter`

```typescript
const { EventEmitter } = require('events');
const myEmitter = new EventEmitter();
```

* **`on(event, listener)`**: Đăng ký một hàm listener để lắng nghe sự kiện. Hàm này sẽ chạy **mỗi lần** sự kiện đó được phát ra (alias là `addListener`).
* **`once(event, listener)`**: Đăng ký một listener chỉ chạy **duy nhất một lần**. Sau khi chạy xong, nó tự động bị hủy bỏ.
* **`emit(event, ...args)`**: Kích hoạt phát ra sự kiện, truyền thêm các tham số `args` vào các hàm listener.
* **`off(event, listener)`**: Hủy đăng ký một hàm listener cụ thể (alias là `removeListener`).

---

### 2. Các cơ chế nâng cao bắt buộc phải nắm vững

#### a. Tính đồng bộ mặc định (Synchronous Execution)
Có một hiểu lầm cực kỳ lớn là nghĩ rằng các listener của `EventEmitter` chạy bất đồng bộ. 

> [!IMPORTANT]
> ### Sự thật kỹ thuật
> `EventEmitter` gọi tất cả các listener **đồng bộ (synchronously)** theo đúng thứ tự chúng được đăng ký. Luồng thực thi JavaScript chính sẽ đợi cho đến khi tất cả các listener chạy xong mới đi tiếp các dòng code tiếp theo.
>
> ```typescript
> myEmitter.on('event', () => console.log('A'));
> myEmitter.on('event', () => console.log('B'));
> myEmitter.emit('event'); 
> // Luôn in ra A trước rồi đến B một cách đồng bộ
> ```

---

#### b. Sự kiện Lỗi đặc biệt: Sự kiện `'error'`
Trong `EventEmitter`, tên sự kiện `'error'` được Node.js đối xử theo một cơ chế đặc biệt vô cùng nghiêm ngặt:

* Nếu một đối tượng phát ra sự kiện `'error'` (`myEmitter.emit('error', new Error('Fail'))`) mà **không có bất kỳ listener nào** được đăng ký để lắng nghe sự kiện `'error'` đó:
  * Node.js sẽ ngay lập tức **ném ra lỗi đó (throw error)**, in ra stack trace và **ngắt tiến trình (crash process) của Server**.

> [!WARNING]
> Luôn luôn đăng ký ít nhất một listener cho sự kiện `'error'` trên các đối tượng EventEmitter để tránh tình trạng crash ứng dụng đột ngột.
> ```typescript
> myEmitter.on('error', (err) => {
>   console.error('Đã bắt được lỗi an toàn:', err.message);
> });
> ```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy cùng thiết kế một lớp quản lý đơn hàng `OrderService` kế thừa `EventEmitter` để điều phối hoạt động gửi email và cập nhật kho khi có đơn hàng mới:

```javascript
const EventEmitter = require('events');

class OrderService extends EventEmitter {
  createOrder(orderId, productName) {
    console.log(`[Order] Đã tạo đơn hàng: ${orderId} - ${productName}`);
    
    // Phát ra sự kiện 'order_created' kèm dữ liệu đơn hàng
    this.emit('order_created', { orderId, productName });
  }
}

const orderService = new OrderService();

// Lắng nghe sự kiện để gửi email cho khách hàng
orderService.on('order_created', (data) => {
  console.log(`[Email Service] Đang gửi email xác nhận cho đơn hàng: ${data.orderId}`);
});

// Lắng nghe sự kiện để cập nhật số lượng tồn kho
orderService.on('order_created', (data) => {
  console.log(`[Inventory Service] Đã trừ kho cho sản phẩm: ${data.productName}`);
});

// Chạy thử
orderService.createOrder("HD-1002", "Bàn phím cơ");
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### Cạm bẫy rò rỉ bộ nhớ (Memory Leaks do Emitter Listeners)
> Mỗi lần bạn gọi `myEmitter.on()`, một tham chiếu đến hàm listener sẽ được lưu trữ trong mảng nội bộ của Emitter.
>
> Nếu bạn đăng ký listener vào một đối tượng Emitter tồn tại lâu dài (ví dụ: đối tượng Socket kết nối toàn cục) bên trong một hàm chạy thường xuyên mà **quên gọi `.off()` để gỡ bỏ**, các hàm này sẽ tích tụ dần trong RAM và GC không thể dọn dẹp, gây ra **Memory Leak**.
>
> **Cảnh báo của Node.js:** Mặc định, nếu bạn đăng ký quá **10 listeners** cho cùng 1 sự kiện trên 1 đối tượng, Node.js sẽ in ra cảnh báo trên console:
> `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 listeners added...`
>
> **Quy tắc cốt lõi:**
> - Luôn dọn dẹp các listener bằng `.off()` khi đối tượng sử dụng bị hủy (ví dụ: khi kết thúc request, đóng connection).
> - Nếu bạn thực sự cần nhiều listener hơn 10 cho một trường hợp hợp lệ, hãy tăng giới hạn bằng: `myEmitter.setMaxListeners(n)`.
