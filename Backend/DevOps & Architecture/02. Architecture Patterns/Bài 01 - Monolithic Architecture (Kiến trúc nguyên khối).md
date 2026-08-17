## I. KHÁI QUÁT (OVERVIEW)

### 1. Monolithic Architecture là gì?
**Kiến trúc nguyên khối (Monolithic Architecture)** là mô hình thiết kế phần mềm truyền thống nhưng vô cùng mạnh mẽ, trong đó toàn bộ hệ thống được xây dựng và đóng gói thành một đơn vị duy nhất:
* **Single Codebase:** Toàn bộ logic nghiệp vụ (Auth, User, Product, Order, Payment, Notification) nằm chung trong một kho mã nguồn.
* **Single Database:** Toàn bộ các module cùng chia sẻ và tương tác với một cơ sở dữ liệu quan hệ (PostgreSQL / MySQL) duy nhất.
* **Single Deployment Unit:** Toàn bộ ứng dụng được build thành một file thực thi hoặc một Docker Image duy nhất và triển khai đồng loạt.

```text
┌─────────────────────────────────────────────────────────────┐
│                 MONOLITHIC BACKEND APPLICATION              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Auth Module  │  │ User Module  │  │   Order Module    │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         │                 │                    │            │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌─────────┴─────────┐  │
│  │Payment Module│  │Product Module│  │Notification Module│  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         └─────────────────┼────────────────────┘            │
│                           ▼ (In-Memory Function Calls)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │  Single Shared Database   │
              │   (PostgreSQL / MySQL)    │
              └───────────────────────────┘
```

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Phân tích Chuyên sâu: Ưu điểm & Nhược điểm

#### Ưu điểm vượt trội:
1. **Đơn giản hóa Triển khai & Vận hành (DevOps):** Chỉ cần một CI/CD pipeline duy nhất, một Dockerfile, cấu hình giám sát (monitoring) và ghi log tập trung dễ dàng.
2. **Giao tiếp nội bộ siêu tốc (Zero Network Latency):** Các module gọi nhau bằng hàm thông thường (In-Memory Function Call) với độ trễ tính bằng nano-giây, không tốn chi phí đóng gói gói tin mạng như HTTP/gRPC.
3. **Quản lý Transaction ACID dễ dàng:** Việc đảm bảo tính toàn vẹn dữ liệu (ví dụ: tạo Đơn hàng đồng thời trừ Tồn kho) được xử lý hoàn hảo thông qua Database Transaction (`BEGIN ... COMMIT / ROLLBACK`), không cần cơ chế phân tán phức tạp.
4. **Debug và Tracing dễ dàng:** Stack trace lỗi liền mạch từ tầng Controller đến Database, có thể đặt breakpoint debug từng dòng trực tiếp trên IDE.

#### Nhược điểm và Giới hạn:
1. **Không thể Scale độc lập từng phần:** Nếu module xử lý xuất hóa đơn PDF ngốn nhiều CPU/RAM, bạn bắt buộc phải nhân bản (scale) toàn bộ ứng dụng Monolith, gây lãng phí tài nguyên nghiêm trọng.
2. **Rủi ro triển khai toàn cục (Single Point of Failure):** Sửa một dòng code lỗi ở module Notification có thể làm sập toàn bộ tiến trình ứng dụng, kéo theo tê liệt cả module Auth và Payment.
3. **Nguy cơ suy thoái thành "Đống bùn khổng lồ" (Big Ball of Mud):** Khi dự án phát triển qua nhiều năm với nhiều lập trình viên, các module dễ dàng import chéo tùy tiện, phá vỡ ranh giới nghiệp vụ và biến codebase thành mớ hỗn độn không thể bảo trì.

---

### 2. Kiến trúc Chuyển tiếp: Modular Monolith (Monolith mô-đun hóa)

**Modular Monolith** là mô hình chuẩn mực giúp giữ nguyên sự đơn giản trong triển khai của Monolith nhưng đảm bảo tính cô lập, ranh giới rõ ràng theo nguyên lý **Domain-Driven Design (DDD)**.

```text
┌──────────────────────────────────────────────────────────────────┐
│                    MODULAR MONOLITH APPLICATION                  │
│                                                                  │
│  ┌────────────────────────┐          ┌────────────────────────┐  │
│  │      Order Module      │          │     Payment Module     │  │
│  │  ┌──────────────────┐  │          │  ┌──────────────────┐  │  │
│  │  │ Internal Logic   │  │          │  │ Internal Logic   │  │  │
│  │  │ & Private Entity │  │          │  │ & Private Entity │  │  │
│  │  └────────┬─────────┘  │          │  └────────▲─────────┘  │  │
│  │           ▼            │          │           │            │  │
│  │   [Public Interface]───┼──────────┼───────────┘            │  │
│  │   (Contract/Facade)    │ (In-mem) │  (Chỉ gọi qua Public)  │  │
│  └────────────────────────┘          └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

* **Nguyên tắc đóng gói:** Mỗi Module chỉ phơi bày (expose) một `PublicService` hoặc `Facade Interface`. Các module khác tuyệt đối không được truy cập trực tiếp vào `Entity` hay `Repository` nội bộ của module này.
* **Sẵn sàng cho Microservices:** Khi cần tách một module thành Microservice độc lập trong tương lai, bạn chỉ cần chuyển interface gọi hàm nội bộ thành giao tiếp qua HTTP/gRPC/Message Queue mà không cần đập đi viết lại toàn bộ logic.

---

### 3. Khi nào nên và không nên chọn Monolithic Architecture?

| Tiêu chí | Nên chọn Monolith | Cân nhắc chuyển sang Microservices |
| :--- | :--- | :--- |
| **Quy mô đội ngũ** | Nhỏ (< 10 - 15 kỹ sư) | Lớn (> 25 - 50 kỹ sư chia nhiều team độc lập) |
| **Giai đoạn dự án** | Startup, MVP, xây dựng tính năng mới | Sản phẩm đã ổn định domain, tăng trưởng quy mô lớn |
| **Domain nghiệp vụ** | Chưa rõ ràng, thay đổi liên tục | Bounded Contexts đã định hình cực kỳ chuẩn xác |
| **Tài nguyên DevOps** | Hạn chế, tập trung tối đa vào Business Logic | Đội ngũ DevOps chuyên trách hạ tầng Kubernetes, K8s mesh |

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

### 1. Cấu trúc thư mục chuẩn Modular Monolith trong NestJS

```text
src/
├── app.module.ts              # Root Module kết nối toàn bộ hệ thống
├── main.ts                    # Entry point khởi chạy HTTP Server
├── common/                    # Shared DTOs, Guards, Interceptors, Filters
│   ├── decorators/
│   ├── filters/
│   └── guards/
└── modules/                   # Từng Bounded Context riêng biệt
    ├── orders/
    │   ├── dto/
    │   ├── entities/          # OrderEntity (Private với Orders Module)
    │   ├── orders.controller.ts
    │   ├── orders.service.ts  # Logic nội bộ
    │   ├── orders.facade.ts   # Public API cung cấp cho các module khác dùng
    │   └── orders.module.ts
    └── payments/
        ├── dto/
        ├── entities/          # PaymentEntity (Private với Payments Module)
        ├── payments.controller.ts
        ├── payments.service.ts
        └── payments.module.ts
```

---

### 2. Triển khai Modular Monolith: Giao tiếp lỏng lẻo (Decoupled Communication)

Dưới đây là ví dụ chuẩn: `OrdersModule` gọi dịch vụ thanh toán của `PaymentsModule` thông qua Contract công khai, không xâm phạm cơ sở dữ liệu của nhau:

```typescript
// ==============================================================
// 1. File: src/modules/payments/payments.service.ts
// Cung cấp dịch vụ công khai với Contract rõ ràng
// ==============================================================
import { Injectable, Logger } from '@nestjs/common';

export interface ProcessPaymentInput {
  orderId: string;
  amount: number;
  currency: string;
}

export interface PaymentResult {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    this.logger.log(`Đang xử lý thanh toán cho đơn hàng: ${input.orderId} số tiền ${input.amount}`);
    
    // Giả lập xử lý thanh toán nội bộ
    return {
      transactionId: `TXN-${Date.now()}`,
      status: 'SUCCESS',
    };
  }
}
```

```typescript
// ==============================================================
// 2. File: src/modules/payments/payments.module.ts
// Đóng gói và chỉ export Service cần thiết ra ngoài
// ==============================================================
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Module({
  providers: [PaymentsService],
  exports: [PaymentsService], // 🛡️ Chỉ chia sẻ PaymentsService cho module khác
})
export class PaymentsModule {}
```

```typescript
// ==============================================================
// 3. File: src/modules/orders/orders.service.ts
// Sử dụng PaymentsService mà không phụ thuộc vào PaymentEntity hay Database
// ==============================================================
import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    // Inject service từ module khác thông qua DI của NestJS
    private readonly paymentsService: PaymentsService,
  ) {}

  async createOrder(userId: string, items: any[], totalAmount: number) {
    const orderId = `ORD-${Date.now()}`;

    // Gọi thanh toán qua interface rõ ràng
    const payment = await this.paymentsService.processPayment({
      orderId,
      amount: totalAmount,
      currency: 'VND',
    });

    if (payment.status !== 'SUCCESS') {
      throw new BadRequestException('Thanh toán đơn hàng thất bại!');
    }

    return {
      orderId,
      userId,
      status: 'PAID',
      transactionId: payment.transactionId,
    };
  }
}
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy "God Service" (Lớp Service gánh vác cả vũ trụ)
> Tránh tình trạng viết một `AppService` hoặc `CommonService` chứa hàng ngàn dòng code làm tất cả mọi việc từ xác thực, tính tiền đến gửi email. 
> - **Quy tắc cốt lõi:** Luôn tuân thủ nguyên lý **Single Responsibility**. Mỗi service chỉ chịu trách nhiệm cho một phạm vi nghiệp vụ duy nhất.

> [!WARNING]
> ### 2. Cạm bẫy phụ thuộc vòng (Circular Dependency)
> Lỗi xảy ra khi `OrderModule` import `UserModule`, đồng thời `UserModule` lại import `OrderModule`. NestJS sẽ báo lỗi không thể giải quyết dependency injection lúc khởi động.
> - **Giải pháp:** Nếu hai module cần trao đổi dữ liệu hai chiều, hãy sử dụng **Event Emitter (In-Memory Event-Driven)** hoặc tách logic dùng chung ra một module trung gian thứ ba.

> [!IMPORTANT]
> ### 3. Quy tắc "Monolith First" của Martin Fowler
> Tuyệt đối không bắt đầu một dự án mới bằng Microservices trừ khi bạn hiểu sâu sắc domain nghiệp vụ và có đủ nguồn lực hạ tầng. Hầu hết các hệ thống lớn nhất thế giới (Shopify, GitHub, StackOverflow) đều bắt đầu và đạt được thành công rực rỡ từ nền tảng Monolith vững chắc.

> [!TIP]
> ### 4. Phân chia Database Schema logic trong Modular Monolith
> Ngay cả khi dùng chung một Database vật lý, bạn nên phân tách các bảng theo tiền tố hoặc Postgres Schema riêng biệt (ví dụ: `order_orders`, `order_items` và `payment_transactions`). Điều này giúp ngăn chặn các truy vấn `JOIN` chéo vô tội vạ giữa các domain, giúp việc tách Database sau này dễ dàng hơn 100 lần.
