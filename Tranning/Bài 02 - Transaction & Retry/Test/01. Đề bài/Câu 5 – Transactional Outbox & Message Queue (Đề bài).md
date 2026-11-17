## I. BỐI CẢNH HỆ THỐNG

Giả sử bạn đang xây dựng hệ thống đặt hàng (**Order Service**) bằng **NestJS**, **PostgreSQL** và **RabbitMQ**.

Khi khách hàng đặt hàng, hệ thống cần thực hiện hai việc:
1. Lưu thông tin đơn hàng vào PostgreSQL.
2. Gửi event `ORDER_CREATED` lên RabbitMQ để Inventory Service xử lý trừ tồn kho.

### Đoạn mã triển khai hiện tại:
```typescript
async createOrder(dto: CreateOrderDto) {
  const order = await this.orderRepository.create(dto);

  await this.rabbitMQ.publish('ORDER_CREATED', {
    orderId: order.id,
  });

  return order;
}
```

---

## II. 4 TÌNH HUỐNG THỰC CHIẾN CẦN PHÂN TÍCH

Hãy phân tích và đưa ra giải pháp thiết kế cho 4 tình huống sau:

### Tình huống 1 – Database và RabbitMQ không đồng bộ
Database đã lưu Order thành công nhưng RabbitMQ bị mất kết nối ngay trước khi publish event.
* Hệ thống hiện tại sẽ xảy ra vấn đề gì?
* Bạn sẽ xử lý thế nào để không mất event?

### Tình huống 2 – Worker bị chết sau khi publish
Bạn triển khai Transactional Outbox:
* Order và OutboxEvent được lưu trong cùng một DB transaction.
* Worker định kỳ đọc các OutboxEvent chưa được publish.
* Worker publish event lên RabbitMQ thành công.
* Tuy nhiên, Worker bị crash trước khi cập nhật trạng thái OutboxEvent thành `PUBLISHED`.

Khi Worker khởi động lại:
* Điều gì sẽ xảy ra?
* Có khả năng event bị gửi nhiều lần không?
* Bạn xử lý tình huống này như thế nào?

### Tình huống 3 – Consumer xử lý trùng event
Inventory Service nhận được cùng một event `ORDER_CREATED` hai lần.
* Làm thế nào để đảm bảo một Order chỉ bị trừ tồn kho một lần?
* Bạn sẽ thiết kế database và logic Consumer như thế nào để xử lý tính idempotent?
* Nếu Consumer xử lý xong nhưng chết trước khi ACK message thì sao?

### Tình huống 4 – Consumer xử lý thất bại
Consumer nhận event nhưng không thể xử lý vì PostgreSQL tạm thời mất kết nối.
* Bạn thiết kế cơ chế retry như thế nào?
* Làm sao phân biệt lỗi tạm thời và lỗi không thể khắc phục?
* Khi nào nên đưa message vào Dead Letter Queue (DLQ)?
* Làm thế nào để tránh message được retry vô hạn?

---

## III. YÊU CẦU TRẢ LỜI & ĐÁNH GIÁ

* Bạn hãy trả lời lần lượt cả 4 tình huống, có thể đưa ra pseudo-code hoặc thiết kế bảng nếu cần.
* **Lưu ý:** Không cần trả lời theo đúng một mẫu có sẵn. Mục tiêu đánh giá là cách bạn suy luận và thiết kế một hệ thống có thể vận hành thực tế (Production-grade).

> [!TIP]
> 📖 **Dành cho người chấm / Giảng viên:**
> Xem đáp án chuẩn tại: [Câu 5 – Transactional Outbox & Message Queue (Đáp án)](../02.%20%C4%90%C3%A1p%20%C3%A1n/C%C3%A2u%205%20%E2%80%93%20Transactional%20Outbox%20&%20Message%20Queue%20(%C4%90%C3%A1p%20%C3%A1n).md)
