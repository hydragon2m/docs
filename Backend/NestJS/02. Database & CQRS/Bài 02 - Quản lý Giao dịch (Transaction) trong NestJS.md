## I. KHÁI QUÁT (OVERVIEW)

Trong ứng dụng backend, việc quản lý giao dịch (Transaction) là yếu tố sống còn để đảm bảo tính toàn vẹn dữ liệu (Data Integrity). Đặc tính ACID (Atomicity, Consistency, Isolation, Durability) đảm bảo rằng một nhóm các thay đổi vào cơ sở dữ liệu phải thành công hoàn toàn hoặc thất bại và rollback hoàn toàn.

Trong môi trường NestJS, sự kết hợp với Dependency Injection (DI) tạo ra một vài thách thức khi quản lý transaction, do các Service thường là Singleton và chia sẻ instance giữa nhiều request. Bài viết này trình bày các phương pháp tiếp cận từ cơ bản đến nâng cao để quản lý transaction an toàn trong NestJS.

> [!IMPORTANT]
> Thách thức chính: Để nhiều repository methods chia sẻ chung một transaction, chúng ta phải "chuyền" (pass) một context kết nối chung (thường là `QueryRunner` hoặc `EntityManager`) qua mọi method. Điều này dễ làm "bẩn" code (vi phạm Separation of Concerns) nếu không thiết kế khéo léo.

## II. CHI TIẾT KỸ THUẬT

### Phương pháp 1: Transaction thủ công bằng `DataSource` và `QueryRunner`

Đây là cách cơ bản nhất, cung cấp quyền kiểm soát tối đa nhưng code thường dài và lặp lại.

```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(private dataSource: DataSource) {}

  async createOrder(orderDto: any) {
    // 1. Tạo Query Runner
    const queryRunner = this.dataSource.createQueryRunner();
    
    // 2. Kết nối tới DB và bắt đầu transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Thực thi các logic với queryRunner.manager thay vì repository thông thường
      const order = queryRunner.manager.create(Order, orderDto);
      await queryRunner.manager.save(order);

      const payment = queryRunner.manager.create(Payment, { amount: orderDto.amount });
      await queryRunner.manager.save(payment);

      // 4. Thành công => Commit
      await queryRunner.commitTransaction();
      return order;
    } catch (error) {
      // 5. Thất bại => Rollback
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Transaction failed');
    } finally {
      // 6. LUÔN LUÔN release query runner
      await queryRunner.release();
    }
  }
}
```

> [!CAUTION]
> Luôn đặt `queryRunner.release()` bên trong khối `finally`. Nếu quên release, connection sẽ bị kẹt (leak) trong pool, dần dần ứng dụng sẽ sập do cạn kiệt số lượng connection (Connection Pool Exhaustion).

### Phương pháp 2: Sử dụng `dataSource.transaction()`

TypeORM cung cấp một phương thức wrapper giúp tự động hóa khối try-catch và giải phóng connection.

```typescript
async createOrder(orderDto: any) {
  return await this.dataSource.transaction(async (transactionalEntityManager) => {
    // Nếu có lỗi ném ra bên trong callback này, TypeORM sẽ tự động rollback.
    // Nếu callback chạy xong, tự động commit.
    
    const order = transactionalEntityManager.create(Order, orderDto);
    await transactionalEntityManager.save(order);

    const payment = transactionalEntityManager.create(Payment, { amount: orderDto.amount });
    await transactionalEntityManager.save(payment);
    
    return order;
  });
}
```

**Nhược điểm:** Mặc dù ngắn gọn hơn, nhưng bạn không thể sử dụng các hàm hoặc service đã có sử dụng tiêm `Repository` của TypeORM. Tất cả các thao tác db bên trong phải dùng qua tham số `transactionalEntityManager`.

### Phương pháp 3: Sử dụng Custom Transaction Decorator qua AsyncLocalStorage (AOP)

Để giữ code Service sạch sẽ và không phải chuyền `EntityManager`, chúng ta có thể sử dụng thư viện `cls-hooked` hoặc tính năng native `AsyncLocalStorage` của Node.js để tạo ra một context transaction vô hình.

Có một thư viện phổ biến tên là `typeorm-transactional` kết hợp rất tốt với NestJS.

**Cài đặt:**
```bash
npm install typeorm-transactional
```

**Thiết lập trong `main.ts`:**
```typescript
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  // Cần gọi trước khi ứng dụng khởi chạy
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

**Cấu hình trong `app.module.ts`:**
```typescript
TypeOrmModule.forRootAsync({
  useFactory: () => ({ ... }),
  async dataSourceFactory(options) {
    if (!options) {
      throw new Error('Invalid options passed');
    }
    // Wraps DataSource
    return addTransactionalDataSource(new DataSource(options));
  },
})
```

**Sử dụng với Decorator `@Transactional()`:**
```typescript
import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private paymentService: PaymentService
  ) {}

  @Transactional()
  async createOrder(orderDto: any) {
    // Bên trong decorator này, mọi gọi hàm repository đều nằm chung một giao dịch!
    const order = this.orderRepo.create(orderDto);
    await this.orderRepo.save(order);

    // Dù gọi sang một Service khác, giao dịch vẫn được giữ nguyên.
    await this.paymentService.processPayment(order.id, orderDto.amount);
  }
}
```

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

Đoạn code sử dụng `typeorm-transactional` cho thấy ưu điểm tuyệt đối: Sự phân tách mối quan tâm (Separation of Concerns). `OrderService` và `PaymentService` hoàn toàn không biết gì về `QueryRunner`. Chúng chỉ gọi method của Repository thông thường. Middleware ẩn bên dưới thông qua `AsyncLocalStorage` đã thay thế ngầm cái connection thông thường của repository bằng connection thuộc về Transaction hiện tại.

> [!TIP]
> `AsyncLocalStorage` lưu trữ trạng thái dựa trên luồng execution bất đồng bộ (call chain), tương tự như Thread-local storage trong Java hay C#.

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

1. **Deadlock**:
   Khi sử dụng transaction trên nhiều record, luôn đảm bảo thứ tự khóa record là đồng nhất. Ví dụ, nếu Transaction A update User 1 rồi đến User 2, thì Transaction B cũng phải xử lý theo chiều tăng dần ID. Nếu Transaction B làm ngược lại, có thể gây ra Deadlock.

2. **Isolation Level**:
   Mặc định các DBMS dùng `READ COMMITTED` hoặc `REPEATABLE READ`. Bạn có thể tùy chỉnh level cho transaction nếu cần thiết để tránh các lỗi như *Phantom Read*. Ví dụ trong QueryRunner: `queryRunner.startTransaction('SERIALIZABLE')`.

3. **Transaction dài**:
   Hạn chế thực hiện các tác vụ tốn thời gian (như call API bên thứ 3, gửi Email) BÊN TRONG khối transaction. Nó sẽ giữ connection lâu, khóa dòng (row lock) lâu hơn, làm chậm toàn hệ thống. Hãy dời các tác vụ I/O chậm ra NGOÀI transaction sau khi đã commit thành công.

4. **Async/Await trong forEach**:
   Tuyệt đối không dùng `array.forEach(async () => {})` trong Transaction vì TypeORM sẽ không đợi các lời gọi đó hoàn tất trước khi commit. Hãy dùng `for...of` hoặc `Promise.all()`.
