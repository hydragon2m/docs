## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần Kiến trúc Hướng sự kiện (Event-Driven Architecture - EDA)?
Trong kiến trúc hướng dịch vụ truyền thống, các service thường giao tiếp với nhau bằng lời gọi đồng bộ (**Synchronous Request/Response** qua HTTP REST hoặc gRPC). Mô hình này tồn tại 3 nhược điểm lớn:

* **Khớp nối chặt chẽ (Tight Coupling):** Service A bắt buộc phải biết chính xác địa chỉ mạng, định dạng API và trạng thái sẵn sàng của Service B.
* **Thời gian đáp ứng tích lũy (Cumulative Latency):** Request của người dùng bị giữ chờ (blocking) qua một chuỗi các lời gọi dịch vụ dài.
* **Suy giảm khả năng chịu tải:** Khi lưu lượng truy cập tăng vọt đột ngột (Flash Sale), các service xử lý nặng phía sau (tính toán hóa đơn, gửi email, phân tích dữ liệu) sẽ bị quá tải và sụp đổ.

**Kiến trúc hướng sự kiện (EDA) và Hàng đợi tin nhắn (Message Broker)** giải quyết vấn đề này bằng giao tiếp bất đồng bộ (**Asynchronous Messaging**):
* **Khớp nối lỏng (Decoupling):** Service gửi tin nhắn (Producer) chỉ đẩy sự kiện vào Broker rồi lập tức phản hồi cho client. Service không cần biết ai sẽ tiêu thụ tin nhắn này và khi nào.
* **Bộ đệm làm mịn tải (Load Leveling / Traffic Buffering):** Message Broker hoạt động như một hồ chứa nước, lưu trữ an toàn hàng triệu tin nhắn khi hệ thống bị quá tải, giúp các Consumer tiêu thụ từ từ theo đúng năng lực xử lý.

```mermaid
flowchart LR
    Producer([Order Service\n(Producer)]) -->|1. Publish Event\n'OrderPlaced'| Broker[(Message Broker\nRabbitMQ / Kafka)]
    
    subgraph Consumers
        Broker -->|Async Consume| EmailSvc[Email Service]
        Broker -->|Async Consume| BillingSvc[Billing Service]
        Broker -->|Async Consume| AnalyticsSvc[Analytics Service]
    end
```

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Phân biệt Message Queue vs Event Streaming
Hiểu rõ sự khác biệt giữa hai mô hình này là điều kiện tiên quyết để chọn đúng công cụ:

| Tiêu chí | Traditional Message Queue (RabbitMQ, SQS) | Event Streaming (Apache Kafka, Redpanda) |
| :--- | :--- | :--- |
| **Mô hình cốt lõi** | Message-centric (Hàng đợi điểm-tới-điểm hoặc phân phối linh hoạt) | Log-centric (Ghi log sự kiện liên tục, tuần tự và bất biến) |
| **Trạng thái tin nhắn sau tiêu thụ** | **Bị xóa vĩnh viễn** khỏi Queue ngay khi Consumer gửi ACK thành công | **Được giữ lại (Retained)** theo thời gian cấu hình (vd: 7 ngày, 30 ngày) |
| **Khả năng Replay (Phát lại)** | ❌ Không thể phát lại tin nhắn cũ | ✅ Rất dễ dàng (Consumer tua lại Offset để đọc lại dữ liệu) |
| **Cơ chế phân phối** | Broker chủ động đẩy (Push) hoặc Consumer kéo (Pull) | Consumer chủ động kéo (Pull) theo tốc độ của mình |
| **Thông lượng (Throughput)** | Hàng chục ngàn tin nhắn/giây | Hàng triệu tin nhắn/giây (High Throughput) |
| **Trường hợp sử dụng phù hợp** | Background jobs, xử lý tác vụ phức tạp, routing nâng cao | Xử lý dữ liệu lớn, Real-time Analytics, Event Sourcing |

---

### 2. RabbitMQ Deep Dive
RabbitMQ hoạt động dựa trên tiêu chuẩn AMQP 0-9-1. Thành phần quan trọng nhất tạo nên sức mạnh của RabbitMQ là **Exchange** và **Binding**:

```mermaid
flowchart LR
    P[Producer] -->|Publish with Routing Key| E{Exchange}
    
    E -->|Direct: exact match| Q1[(Queue A)]
    E -->|Fanout: broadcast to all| Q2[(Queue B)]
    E -->|Topic: regex wildcard| Q3[(Queue C)]
    
    Q1 --> C1[Consumer 1]
    Q2 --> C2[Consumer 2]
    Q3 --> C3[Consumer 3]
```

#### Các loại Exchange kinh điển:
1. **Direct Exchange:** Định tuyến tin nhắn đến Queue có `binding_key` trùng khớp **chính xác 100%** với `routing_key` của tin nhắn.
2. **Fanout Exchange:** Bỏ qua `routing_key`, sao chép và phát tán (broadcast) tin nhắn đến **tất cả** các Queue được gắn vào nó.
3. **Topic Exchange:** Định tuyến linh hoạt dựa trên so khớp mẫu từ khóa dạng phân cấp, sử dụng ký tự đại diện:
   * `*` (dấu sao): Khớp chính xác 1 từ (vd: `order.*.created` khớp với `order.vn.created`).
   * `#` (dấu thăng): Khớp 0 hoặc nhiều từ (vd: `audit.#` khớp với `audit.user.login.failed`).
4. **Headers Exchange:** Định tuyến dựa trên các thuộc tính trong Headers của tin nhắn thay vì Routing key.

#### Cơ chế đảm bảo tin cậy:
* **Message Acknowledgement (ACK / NACK):** Consumer sau khi xử lý xong tin nhắn sẽ gửi `ACK`. Nếu Consumer bị crash giữa chừng, kết nối TCP đóng lại, RabbitMQ sẽ tự động trả tin nhắn đó về Queue (`re-queue`) để Worker khác xử lý.
* **Dead Letter Queue (DLQ):** Khi một tin nhắn bị NACK (và không re-queue), hoặc bị từ chối do quá số lần thử lại (Retry Limit), hoặc hết hạn TTL (Time-To-Live), tin nhắn sẽ được đẩy sang DLQ để kỹ sư kiểm tra và debug thủ công mà không làm nghẽn hàng đợi chính.

---

### 3. Apache Kafka Deep Dive
Kafka được thiết kế như một **Distributed Append-Only Commit Log** phân tán cực nhanh.

```mermaid
flowchart TD
    subgraph Topic: 'orders-v1'
        subgraph Partition 0
            P0_0[Offset 0] --- P0_1[Offset 1] --- P0_2[Offset 2] --- P0_3[Offset 3]
        end
        subgraph Partition 1
            P1_0[Offset 0] --- P1_1[Offset 1] --- P1_2[Offset 2]
        end
    end
    
    subgraph Consumer Group: 'payment-processors'
        C1[Consumer 1] -->|Đọc tuần tự| Partition 0
        C2[Consumer 2] -->|Đọc tuần tự| Partition 1
    end
```

#### Cấu trúc thành phần:
* **Topic & Partition:** Một Topic được chia nhỏ thành nhiều Partition lưu trữ trên nhiều máy chủ (Brokers). Partition là đơn vị song song hóa (Parallelism) của Kafka.
* **Offset:** Vị trí số thứ tự của mỗi record trong partition. Consumer tự lưu trữ vị trí Offset mà nó đã đọc xong.
* **Consumer Group:** Tập hợp các consumer cùng chia sẻ việc đọc dữ liệu từ một Topic. **Quy tắc vàng:** Trong một Consumer Group, mỗi Partition chỉ được tiêu thụ bởi đúng 1 Consumer tại một thời điểm.
* **Thứ tự tin nhắn (Ordering Guarantee):** Kafka **chỉ đảm bảo thứ tự tin nhắn trong cùng 1 Partition**, KHÔNG đảm bảo thứ tự xuyên suốt toàn bộ Topic. Do đó, các tin nhắn có cùng `Message Key` (ví dụ: `userId` hoặc `orderId`) sẽ luôn được hash vào cùng một Partition.

---

### 4. Redis Pub/Sub vs Redis Streams
* **Redis Pub/Sub:** Cơ chế phát tán cực nhanh, cực nhẹ. Tuy nhiên, nó là **Fire-and-Forget**. Nếu không có Subscriber nào đang online tại thời điểm Publish, tin nhắn sẽ biến mất mãi mãi. Không có hàng đợi, không có lưu trữ. Phù hợp cho: Cập nhật cache realtime, thông báo socket cho client online.
* **Redis Streams (từ Redis 5.0):** Bổ sung đầy đủ các tính năng của Kafka thu nhỏ: lưu trữ dữ liệu bền vững (Persistence), Consumer Groups, Acknowledgement (`XACK`), và đọc lại lịch sử (`XRANGE`).

---

### 5. Transport Layer trong NestJS Microservices
NestJS cung cấp module `@nestjs/microservices` trừu tượng hóa toàn bộ giao thức truyền tải bên dưới:

* **Request-Response Pattern (`@MessagePattern`):** Giao tiếp 2 chiều bất đồng bộ (gửi yêu cầu và đợi tin nhắn phản hồi qua Broker).
* **Event-Driven Pattern (`@EventPattern`):** Giao tiếp 1 chiều (Emit-and-forget, không đợi kết quả trả về).

Các Transporter hỗ trợ: **TCP, Redis, RabbitMQ (AMQP), Apache Kafka, gRPC, NATS, MQTT**.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

### 1. Triển khai RabbitMQ Producer & Consumer với `amqplib` chuẩn Production

#### File Producer: Gửi tác vụ với Dead Letter Exchange cấu hình sẵn
```typescript
// producer.ts
import * as amqp from 'amqplib';

const RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'ecommerce_events';
const DLX_NAME = 'ecommerce_dlx';
const QUEUE_NAME = 'order_notifications_queue';
const DLQ_NAME = 'order_notifications_dlq';
const ROUTING_KEY = 'order.created';

async function startProducer() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // 1. Khai báo Dead Letter Exchange và Dead Letter Queue
  await channel.assertExchange(DLX_NAME, 'direct', { durable: true });
  await channel.assertQueue(DLQ_NAME, { durable: true });
  await channel.bindQueue(DLQ_NAME, DLX_NAME, ROUTING_KEY);

  // 2. Khai báo Main Exchange (Topic Exchange)
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

  // 3. Khai báo Main Queue gắn liền với cấu hình chuyển hướng DLX khi có lỗi
  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
    deadLetterExchange: DLX_NAME,
    deadLetterRoutingKey: ROUTING_KEY,
    messageTtl: 60000 // Tin nhắn tự hết hạn sau 60s nếu không ai nhận
  });

  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'order.*');

  // 4. Tạo message payload
  const orderPayload = {
    orderId: 'ORD-98765',
    userId: 'USR-102',
    amount: 250.75,
    timestamp: new Date().toISOString()
  };

  // 5. Gửi message (persistent = true để lưu xuống đĩa cứng, chống mất khi restart RabbitMQ)
  const isSent = channel.publish(
    EXCHANGE_NAME,
    ROUTING_KEY,
    Buffer.from(JSON.stringify(orderPayload)),
    {
      persistent: true,
      contentType: 'application/json',
      headers: { 'x-retry-count': 0 }
    }
  );

  console.log(`[Producer] 📤 Đã gửi Event '${ROUTING_KEY}':`, orderPayload);

  setTimeout(async () => {
    await channel.close();
    await connection.close();
  }, 1000);
}

startProducer().catch(console.error);
```

#### File Consumer: Xử lý tin nhắn an toàn với cơ chế Retry & DLQ
```typescript
// consumer.ts
import * as amqp from 'amqplib';

const RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'order_notifications_queue';
const MAX_RETRY_COUNT = 3;

async function startConsumer() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Đảm bảo chỉ nhận 5 tin nhắn cùng lúc để không bị tràn RAM
  await channel.prefetch(5);

  console.log(`[Consumer] 🎧 Đang lắng nghe tin nhắn từ queue: ${QUEUE_NAME}...`);

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      const contentStr = msg.content.toString();
      const currentRetry = (msg.properties.headers?.['x-retry-count'] as number) || 0;

      try {
        const order = JSON.parse(contentStr);
        console.log(`[Consumer] 📦 Đang xử lý đơn hàng ${order.orderId}...`);

        // Giả lập lỗi ngẫu nhiên để test cơ chế retry
        if (order.amount > 200 && currentRetry < 2) {
          throw new Error('Cổng thanh toán bên thứ ba phản hồi Timeout!');
        }

        // Xử lý thành công -> Gửi ACK
        console.log(`[Consumer] ✅ Xử lý thành công đơn hàng ${order.orderId}`);
        channel.ack(msg);

      } catch (error: any) {
        console.error(`[Consumer] ❌ Lỗi xử lý (Lần thử ${currentRetry + 1}/${MAX_RETRY_COUNT}): ${error.message}`);

        if (currentRetry >= MAX_RETRY_COUNT) {
          console.error(`[Consumer] 💀 Đã vượt quá số lần retry! Đẩy vào Dead Letter Queue (NACK không requeue).`);
          // requeue = false -> RabbitMQ tự động đẩy sang DLX đã cấu hình
          channel.nack(msg, false, false);
        } else {
          // Gửi lại tin nhắn với header retry tăng dần
          channel.ack(msg); // Xóa message cũ
          channel.sendToQueue(QUEUE_NAME, msg.content, {
            persistent: true,
            headers: {
              ...msg.properties.headers,
              'x-retry-count': currentRetry + 1
            }
          });
        }
      }
    },
    { noAck: false } // BẮT BUỘC: noAck = false để quản lý ACK tường minh
  );
}

startConsumer().catch(console.error);
```

---

### 2. NestJS Microservices: Giao tiếp qua RabbitMQ và EventPattern

```typescript
// 1. main.ts trong Microservice Consumer
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'orders_processing_queue',
      queueOptions: {
        durable: true
      },
      noAck: false // Cần xử lý ACK thủ công trong Controller
    }
  });

  await app.listen();
  console.log('🚀 Microservice Consumer đã sẵn sàng nhận message...');
}
bootstrap();
```

```typescript
// 2. orders.controller.ts trong Microservice Consumer
import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';

@Controller()
export class OrdersConsumerController {
  @EventPattern('order_created_event')
  async handleOrderCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      console.log('📩 Nhận Event order_created_event:', data);
      
      // Thực thi logic nghiệp vụ (vd: Gửi Email xác nhận)
      // await this.mailService.sendOrderReceipt(data);

      // Xác nhận hoàn tất xử lý
      channel.ack(originalMsg);
    } catch (err) {
      console.error('Lỗi khi xử lý event:', err);
      // NACK và không đưa lại vào queue nếu lỗi nghiêm trọng
      channel.nack(originalMsg, false, false);
    }
  }
}
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy Message Semantics: "At-Least-Once" là mặc định của mọi hệ thống
> Trong thế giới phân tán, đạt được **Exactly-Once Delivery** thuần túy ở tầng mạng là điều bất khả thi về mặt vật lý.
> * Hầu hết Message Broker (RabbitMQ, Kafka) hoạt động theo cơ chế **At-least-once** (Tin nhắn được đảm bảo gửi đến ít nhất 1 lần, nhưng có thể bị gửi trùng 2-3 lần khi có sự cố mạng).
> * **Quy tắc bắt buộc:** Mọi hàm Consumer **PHẢI có tính Idempotency**. Luôn kiểm tra xem `message_id` hoặc `transaction_id` đã được ghi nhận trong Database/Redis hay chưa trước khi thực hiện hành động ghi.

> [!WARNING]
> ### 2. Mất thứ tự tin nhắn (Message Ordering Pitfall)
> * Nếu bạn có 1 Queue RabbitMQ và chạy 5 Consumer song song, các tin nhắn liên quan đến cùng một đơn hàng (`OrderPlaced`, `OrderUpdated`, `OrderCancelled`) có thể được 3 worker nhận cùng lúc. Worker 3 có thể xử lý `OrderCancelled` xong trước khi Worker 1 kịp xử lý `OrderPlaced`!
> * **Giải pháp:** Sử dụng Apache Kafka với `partitionKey = orderId` để đảm bảo toàn bộ sự kiện của cùng 1 đơn hàng luôn đi vào 1 Partition duy nhất, được 1 Consumer duy nhất đọc tuần tự.

> [!IMPORTANT]
> ### 3. Transactional Outbox Pattern (Chống mất tin nhắn giữa DB và Broker)
> Cạm bẫy kinh điển: Bạn lưu dữ liệu vào PostgreSQL thành công, nhưng trước khi kịp gọi `channel.publish()`, ứng dụng Node.js bị crash hoặc mất điện. Kết quả: Dữ liệu đã lưu nhưng không có event nào được bắn đi.
> * **Giải pháp chuẩn:** Lưu luôn Event cần bắn vào một bảng `outbox_events` trong cùng một Database Transaction với dữ liệu nghiệp vụ.
> * Một tiến trình chạy ngầm (hoặc Debezium CDC) sẽ quét bảng `outbox_events` và đẩy tin nhắn vào Message Broker một cách an toàn tuyệt đối 100%.

> [!TIP]
> ### 4. Luôn cấu hình Prefetch Count (RabbitMQ)
> Mặc định, nếu không cấu hình `channel.prefetch(N)`, RabbitMQ sẽ dồn toàn bộ 100.000 tin nhắn trong queue vào bộ nhớ RAM của một Consumer duy nhất vừa kết nối, dẫn đến lỗi **Out Of Memory (OOM Crash)** ngay lập tức. Luôn đặt `prefetch` từ 10 đến 50 tùy theo thời gian xử lý của mỗi tin nhắn.
