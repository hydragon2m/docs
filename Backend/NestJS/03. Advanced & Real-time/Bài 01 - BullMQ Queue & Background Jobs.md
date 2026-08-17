## I. KHÁI QUÁT (OVERVIEW)

Trong các ứng dụng quy mô lớn, việc xử lý các tác vụ nặng (như gửi email hàng loạt, xử lý video, tạo báo cáo) một cách đồng bộ sẽ làm chặn (block) event loop của Node.js, dẫn đến trải nghiệm người dùng kém và giảm hiệu năng hệ thống. Để giải quyết vấn đề này, chúng ta sử dụng cơ chế Background Jobs thông qua Message Queue.

NestJS cung cấp gói `@nestjs/bull` kết hợp với Redis và thư viện Bull/BullMQ để quản lý hàng đợi một cách mạnh mẽ, ổn định, hỗ trợ retry, delay, và cron jobs.

> [!TIP]
> Sử dụng Message Queue giúp tách biệt các tiến trình nặng ra khỏi luồng xử lý HTTP request chính, tăng cường khả năng chịu tải (scalability) và khả năng phục hồi (resilience) của ứng dụng.

## II. CHI TIẾT KỸ THUẬT

### 1. Cấu hình `@nestjs/bull` với Redis
Cần cài đặt các dependencies: `npm install @nestjs/bull bull redis`.
Trong `AppModule`, ta cấu hình kết nối Redis toàn cục bằng `BullModule.forRoot()`:

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Khai báo Queue bằng `BullModule.registerQueue()`
Để sử dụng một queue cụ thể (ví dụ: gửi email), ta cần đăng ký nó trong module tương ứng:

```typescript
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [EmailService, EmailProcessor],
})
export class EmailModule {}
```

### 3. Inject Queue bằng `@InjectQueue()` và Tạo Producer
Producer chịu trách nhiệm đưa các công việc (Jobs) vào hàng đợi.

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  async sendWelcomeEmail(user: any) {
    const job = await this.emailQueue.add(
      'welcome', // Tên job (tùy chọn)
      { user, time: new Date() }, // Payload
      {
        delay: 5000, // Trì hoãn 5 giây
        attempts: 3, // Thử lại 3 lần nếu lỗi
        backoff: 3000, // Chờ 3 giây trước mỗi lần retry
        lifo: false, // Last-in-first-out
      }
    );
    return job.id;
  }
}
```

### 4. Tạo Consumer bằng `@Processor()` và `@Process()`
Consumer (hay Worker) sẽ lấy jobs từ hàng đợi ra để xử lý.

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('email-queue')
export class EmailProcessor {
  
  @Process('welcome')
  async handleWelcomeEmail(job: Job) {
    console.log(`Processing welcome email for ${job.data.user.email}`);
    // Logic gửi email thực tế...
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      // Giả lập tiến trình
      progress += 1;
      await job.progress(progress);
    }
    return { status: 'success' };
  }
}
```

### 5. Quản lý Job Events toàn cục
Ta có thể lắng nghe các sự kiện của Queue thông qua các decorators như `@OnQueueActive()`, `@OnQueueCompleted()`, `@OnQueueFailed()`.

```typescript
import { OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';

@Processor('email-queue')
export class EmailProcessor {
  @OnQueueActive()
  onActive(job: Job) {
    console.log(`Job ${job.id} is active.`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    console.log(`Job ${job.id} completed with result:`, result);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} failed:`, error);
  }
}
```

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

Giả sử hệ thống e-commerce cần xuất báo cáo doanh thu hàng tháng. Tác vụ này tốn vài phút.

```typescript
// report.module.ts
@Module({
  imports: [BullModule.registerQueue({ name: 'report' })],
  providers: [ReportService, ReportProcessor],
  controllers: [ReportController],
})
export class ReportModule {}

// report.controller.ts
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  async generateReport() {
    await this.reportService.queueReportTask();
    return { message: 'Báo cáo đang được xử lý, bạn sẽ nhận được thông báo khi hoàn thành.' };
  }
}

// report.processor.ts
@Processor('report')
export class ReportProcessor {
  @Process('monthly')
  async processMonthlyReport(job: Job) {
    console.log(`Bắt đầu xử lý báo cáo tháng ${job.data.month}...`);
    // Lấy dữ liệu từ DB, tính toán, tạo PDF...
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Giả lập mất 10s
    return 'report_2023_10.pdf';
  }
}
```

**Phân tích:** 
- Controller trả về phản hồi HTTP ngay lập tức, không bắt client phải chờ 10 giây.
- Worker trong nền (background) xử lý một cách bất đồng bộ.

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

> [!WARNING] Cạm bẫy Concurrency (Đồng thời)
> Mặc định, một processor xử lý từng job một (concurrency = 1). Nếu bạn có hàng nghìn job, nó sẽ rất chậm.
> **Cách khắc phục:** Truyền số `concurrency` vào `@Process({ name: 'task', concurrency: 5 })` để xử lý 5 jobs cùng lúc.

> [!IMPORTANT] Sandbox Processors cho CPU-Intensive Tasks
> Nếu job yêu cầu tính toán quá nặng (CPU bound) như nén video, nó vẫn sẽ block Node.js event loop của NestJS app chính.
> **Giải pháp:** Sử dụng Sandbox Processors (tách riêng thành một file `.js` độc lập, Bull sẽ chạy nó trên một thread/process riêng bằng `child_process`).

> [!CAUTION] Dữ liệu truyền qua Redis (Serialization)
> Payload của Job phải là dữ liệu JSON-serializable. Không thể truyền instance của Class chứa phương thức (method) hoặc File Objects nguyên bản vào Job data vì chúng sẽ bị mất khi lưu vào Redis.

> [!TIP] Giám sát (Monitoring)
> Bạn nên cài đặt công cụ như `bull-board` để có một giao diện UI trực quan quản lý, retry hoặc xóa các jobs bị kẹt trong Redis.
