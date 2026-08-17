## I. KHÁI QUÁT (OVERVIEW)

Khi ứng dụng trở nên lớn mạnh, kiến trúc Monolithic truyền thống bắt đầu gặp khó khăn trong việc bảo trì và mở rộng (scaling). NestJS cung cấp cơ chế Microservices tích hợp sẵn (built-in) thông qua package `@nestjs/microservices`. 

Microservices cho phép bạn chia nhỏ ứng dụng thành nhiều dịch vụ độc lập giao tiếp với nhau qua các Message Brokers hoặc các lớp Transport (TCP, Redis, RabbitMQ, Kafka, gRPC). 

Có hai kiểu giao tiếp chính:
1. **Request-Response (RPC):** Giống HTTP REST nhưng qua giao thức khác. Chờ phản hồi từ microservice khác.
2. **Event-driven (Pub/Sub):** Fire-and-forget. Một dịch vụ phát ra sự kiện, nhiều dịch vụ khác có thể lắng nghe mà không cần phản hồi.

> [!TIP]
> Điểm mạnh nhất của NestJS Microservices là sự nhất quán (consistency). Dù bạn viết HTTP API hay Microservices, cấu trúc code (Controllers, Services, Guards, Pipes) gần như giống hệt nhau.

## II. CHI TIẾT KỸ THUẬT

### 1. Transport Layers
NestJS hỗ trợ nhiều Transporter:
- **TCP:** Mặc định, nhẹ và nhanh. Phù hợp nếu các microservices nằm trên cùng một network nội bộ.
- **Redis / NATS / RabbitMQ / Kafka:** Thích hợp cho Event-driven và khả năng chịu tải tốt, hỗ trợ Message Queue.
- **gRPC:** High-performance RPC framework của Google, truyền dữ liệu bằng protocol buffers (protobuf).

### 2. Cấu hình Hybrid Application
Hybrid App là ứng dụng vừa lắng nghe HTTP requests, vừa lắng nghe message từ Broker.

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Thêm Microservice Listener
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ, // Sử dụng RabbitMQ
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'math_queue',
      queueOptions: {
        durable: false
      },
    },
  });

  await app.startAllMicroservices(); // Khởi động microservices listener
  await app.listen(3000); // Lắng nghe HTTP ở port 3000
}
bootstrap();
```

### 3. @MessagePattern() và @EventPattern()
Sử dụng các decorator này trong Controller để lắng nghe tin nhắn.

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class MathController {

  // Lắng nghe Request-Response (Chờ phản hồi)
  @MessagePattern({ cmd: 'sum' }) // Pattern có thể là string hoặc object
  accumulate(@Payload() data: number[]): number {
    return (data || []).reduce((a, b) => a + b, 0);
  }

  // Lắng nghe Event-driven (Fire and forget)
  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: Record<string, unknown>) {
    console.log('User created event received:', data);
    // Gửi email chào mừng...
  }
}
```

### 4. Giao tiếp giữa các Microservices bằng `ClientProxy`
Để gửi tin nhắn từ Service A sang Service B, ta sử dụng `ClientProxy`.

```typescript
// app.module.ts (Service A)
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'math_queue',
        },
      },
    ]),
  ],
})
export class AppModule {}

// app.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(@Inject('MATH_SERVICE') private client: ClientProxy) {}

  async calculateSum() {
    const payload = [1, 2, 3];
    // Gửi MessagePattern (Request-Response)
    const result = await firstValueFrom(this.client.send({ cmd: 'sum' }, payload));
    return result; // return 6
  }

  async notifyUserCreated() {
    // Gửi EventPattern (Event-driven)
    this.client.emit('user_created', { email: 'test@example.com' });
  }
}
```

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

Mô hình: `Orders Service` (HTTP/Hybrid) gửi message qua RabbitMQ cho `Inventory Service` (Microservice-only) để kiểm tra tồn kho.

- Khi user tạo Order qua API, `Orders Service` gọi `.send()` đến `Inventory Service` để check hàng. Nếu còn hàng, tiếp tục; nếu không, throw Exception.
- Sau khi thanh toán thành công, `Orders Service` phát sự kiện `.emit('order_paid', orderData)`. Cả `Email Service` và `Inventory Service` đều lắng nghe sự kiện này (EventPattern) để trừ kho và gửi email cho khách (Pub/Sub pattern).

Kiến trúc này đảm bảo tính tách rời (loose coupling) và dễ dàng scale từng phần riêng biệt.

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

> [!CAUTION] Timeout & Error Propagation
> Khi gọi `.send()`, nếu microservice đích đang bị sập (down) hoặc mất kết nối, request sẽ bị treo vô hạn với TCP (hoặc treo rất lâu).
> **Giải pháp:** Phải luôn cấu hình Timeout bằng RxJS khi sử dụng ClientProxy: 
> `this.client.send(pattern, data).pipe(timeout(5000));`

> [!WARNING] Serialization & Deserialization
> Dữ liệu được gửi qua các Transporter đều phải được parse thành chuỗi/binary. Nếu bạn gửi một Class instance chứa các phương thức (methods) qua Microservice, các phương thức đó sẽ bị biến mất. Bạn chỉ truyền được dữ liệu thô (POJO - Plain Old JavaScript Objects).

> [!IMPORTANT] Acknowledgement (ACK) trong Message Brokers
> Khi dùng RabbitMQ hay Kafka, đặc biệt chú ý đến cơ chế ACK. Nếu một worker chết giữa chừng khi đang xử lý message (chưa kịp đánh dấu hoàn thành), broker sẽ gửi lại message đó cho worker khác. Hãy đảm bảo code của bạn có tính **Idempotent** (chạy nhiều lần vẫn cho ra cùng kết quả) để tránh lỗi duplicate data.

> [!TIP] Observables vs Promises
> NestJS Microservices sử dụng RxJS (Observables) mặc định cho `this.client.send()`. Bạn có thể return một Observable trong Controller và NestJS sẽ tự động subscribe và gửi kết quả về. Nếu quen thuộc với Async/Await, hãy dùng `firstValueFrom` của RxJS để chuyển Observable thành Promise.
