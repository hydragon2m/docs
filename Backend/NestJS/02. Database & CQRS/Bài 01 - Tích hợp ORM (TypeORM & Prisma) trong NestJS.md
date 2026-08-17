## I. KHÁI QUÁT (OVERVIEW)

Trong hệ sinh thái NestJS, việc kết nối và thao tác với cơ sở dữ liệu thường được thực hiện thông qua các Object-Relational Mapping (ORM). TypeORM và Prisma hiện đang là hai công cụ phổ biến nhất. NestJS hỗ trợ tích hợp sâu TypeORM thông qua module chính thức `@nestjs/typeorm`, đồng thời cũng có thể tích hợp Prisma một cách dễ dàng thông qua các custom service.

Bài viết này sẽ hướng dẫn chi tiết cách thiết lập, cấu hình và sử dụng hai ORM này trong các dự án NestJS từ cơ bản đến nâng cao.

> [!NOTE]
> TypeORM là một ORM theo mô hình Active Record và Data Mapper truyền thống, rất mạnh mẽ cho các dự án phức tạp cần tùy chỉnh sâu bằng SQL. Prisma là một thế hệ ORM mới hơn, cung cấp type-safety tuyệt vời và Schema-driven development.

## II. CHI TIẾT KỸ THUẬT

### 1. Tích hợp TypeORM trong NestJS

Để sử dụng TypeORM, chúng ta cần cài đặt các package cần thiết:
```bash
npm install @nestjs/typeorm typeorm mysql2 # Thay mysql2 bằng driver phù hợp (pg, sqlite3,...)
```

#### a. Cấu hình `TypeOrmModule.forRootAsync()` kết hợp `ConfigService`
Cách tốt nhất để kết nối Database là sử dụng cấu hình bất đồng bộ, nạp thông tin từ biến môi trường.

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USER', 'root'),
        password: configService.get<string>('DB_PASS', 'password'),
        database: configService.get<string>('DB_NAME', 'nestjs_db'),
        autoLoadEntities: true, // Tự động load entities đã đăng ký qua TypeOrmModule.forFeature()
        synchronize: configService.get<string>('NODE_ENV') !== 'production', 
      }),
    }),
  ],
})
export class AppModule {}
```

> [!WARNING]
> Tùy chọn `synchronize: true` sẽ tự động đồng bộ cấu trúc database với entity. TUYỆT ĐỐI KHÔNG sử dụng trên môi trường Production vì có thể gây mất mát dữ liệu do TypeORM drop table hoặc alter column tự động. Nên sử dụng Migrations thay thế.

#### b. Sử dụng `@InjectRepository()` trong Service
Trong NestJS, chúng ta sẽ định nghĩa các Module cho từng domain.

```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  // Khai báo entity để có thể tiêm Repository
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
})
export class UsersModule {}
```

Sau đó tiêm repository vào service:

```typescript
// users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
```

#### c. Custom Repository Pattern (TypeORM v0.3+)
Từ bản TypeORM v0.3, cách tạo custom repository sử dụng `@EntityRepository` đã bị loại bỏ. Để tái tạo Custom Repository trong NestJS, chúng ta có thể sử dụng Custom Provider.

```typescript
// user.repository.ts
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  // Khai báo các custom method
  async findActiveUsers(): Promise<User[]> {
    return this.createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .getMany();
  }
}
```

Trong module:
```typescript
@Module({
  providers: [UserRepository, UsersService],
})
export class UsersModule {}
```

### 2. Tích hợp Prisma trong NestJS

Cài đặt Prisma:
```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

#### Tạo `PrismaService`
Prisma không cung cấp module chính thức cho NestJS, do đó chúng ta cần tự tạo một service quản lý kết nối.

```typescript
// prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Có thể truyền cấu hình logging ở đây
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Tạo một `PrismaModule` để tái sử dụng:
```typescript
// prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

#### Sử dụng Prisma Service
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findMany(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { active: true },
      include: { posts: true }
    });
  }
}
```

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

### So sánh thao tác CRUD giữa TypeORM và Prisma

#### TypeORM:
```typescript
async createUser(dto: CreateUserDto) {
  // 1. Tạo instance của entity
  const user = this.userRepository.create(dto);
  // 2. Lưu vào DB
  return await this.userRepository.save(user);
}
```

#### Prisma:
```typescript
async createUser(dto: CreateUserDto) {
  // Prisma thực hiện trong 1 hàm gọi trực tiếp
  return await this.prisma.user.create({
    data: dto,
  });
}
```

> [!TIP]
> Prisma tạo ra kiểu dữ liệu Typescript hoàn chỉnh dựa trên schema của bạn, do đó trải nghiệm autocompletion rất tuyệt vời. TypeORM đôi khi yêu cầu bạn phải tự quản lý kiểu hoặc truyền thủ công.

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

1. **Hiệu năng và N+1 Problem**:
   - Trong TypeORM, hãy cẩn thận khi sử dụng `relations` trong `find` hoặc truy cập lazy relation, dễ dẫn đến N+1 query. Hãy dùng `QueryBuilder` khi cần fetch dữ liệu quan hệ phức tạp.
   - Trong Prisma, lỗi N+1 thường được tự động optimize bởi Prisma Data Loader tích hợp, nhưng cần cẩn thận với kích thước payload trả về khi dùng `include` lồng nhau sâu.

2. **Khởi tạo Prisma Client**:
   - Chỉ nên khởi tạo MỘT instance duy nhất của `PrismaClient` trong toàn bộ vòng đời ứng dụng NestJS (thông qua `@Global()` Module) để tránh việc kiệt sức Connection Pool của database.

3. **Schema Sync vs Migrations**:
   - Với TypeORM, khi dự án lớn, hãy cấu hình TypeORM CLI và sử dụng Migration scripts `typeorm migration:generate` thay vì dùng `synchronize: true`.
   - Với Prisma, workflow chuẩn là `prisma migrate dev` ở môi trường dev và `prisma migrate deploy` trên CI/CD.

> [!IMPORTANT]
> - **Nên chọn TypeORM khi**: Cần hỗ trợ nhiều loại database khác nhau linh hoạt, hoặc cần tùy biến các câu lệnh SQL phức tạp cao, hoặc team đã quen với kiến trúc OOP / Decorator.
> - **Nên chọn Prisma khi**: Cần type-safety tuyệt đối từ Database lên Code, phát triển nhanh chóng, dự án tập trung vào Node.js và TypeScript, mô hình dữ liệu (schema) rõ ràng.
