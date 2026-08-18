// ==============================================================
// Bài tập Thực hành: NestJS Architecture & Module System
// File: NestJS/09. Practice/01. Architecture & Lifecycle/01. NestJS Architecture.ts
// ==============================================================

/**
 * ĐỀ BÀI:
 * 1. Định nghĩa một Dynamic Module tên là `ConfigModule`.
 *    - Nhận vào một object `ConfigOptions` gồm: `envFile` (string), `isGlobal` (boolean).
 *    - Sử dụng `useFactory` hoặc `useValue` để khởi tạo cấu hình.
 *    - Đọc file cấu hình giả lập (hoặc thực tế) và cung cấp token 'CONFIG_SERVICE'.
 * 
 * 2. Thiết lập một `UsersService`:
 *    - Inject 'CONFIG_SERVICE' sử dụng `@Inject('CONFIG_SERVICE')`.
 *    - Cung cấp phương thức `getDatabaseUrl()` trả về thông tin DB URL từ cấu hình.
 * 
 * 3. Thiết lập `UsersController`:
 *    - Inject `UsersService`.
 *    - Cung cấp endpoint GET `users/db-config` để trả về thông tin cấu hình DB.
 * 
 * 4. Xây dựng một Guard `ApiKeyGuard` ở mức Global hoặc Controller:
 *    - Kiểm tra `x-api-key` trên Request Header.
 *    - Nếu khớp với giá trị cấu hình trong 'CONFIG_SERVICE' thì cho qua, ngược lại ném lỗi `UnauthorizedException`.
 */

import { Module, DynamicModule, Injectable, Inject, Controller, Get, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export interface ConfigOptions {
  envFile: string;
  isGlobal?: boolean;
}

export class ConfigService {
  private readonly configData: Record<string, string> = {};

  constructor(options: ConfigOptions) {
    // Giả lập đọc cấu hình từ file
    this.configData = {
      DATABASE_URL: `postgresql://postgres:secret@localhost:5432/nestjs_db?env=${options.envFile}`,
      API_KEY: 'super-secret-key-123',
    };
  }

  get(key: string): string {
    return this.configData[key];
  }
}

// TODO 1: Hoàn thiện Dynamic Module ConfigModule
@Module({})
export class ConfigModule {
  static register(options: ConfigOptions): DynamicModule {
    // VIẾT CODE CỦA BẠN TẠI ĐÂY (Cung cấp CONFIG_SERVICE dùng useValue hoặc useFactory)
    return {
      module: ConfigModule,
      providers: [],
      exports: [],
    };
  }
}

// TODO 2: Hoàn thiện UsersService inject CONFIG_SERVICE
@Injectable()
export class UsersService {
  // VIẾT CODE CỦA BẠN TẠI ĐÂY (Inject CONFIG_SERVICE qua constructor)
  constructor() {}

  getDatabaseUrl(): string {
    // Sửa lại dòng này để trả về DATABASE_URL từ ConfigService
    return '';
  }
}

// TODO 3: Hoàn thiện ApiKeyGuard kiểm tra API Key
@Injectable()
export class ApiKeyGuard implements CanActivate {
  // VIẾT CODE CỦA BẠN TẠI ĐÂY (Inject ConfigService để kiểm tra x-api-key)
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    
    // So sánh apiKey với giá trị 'API_KEY' trong ConfigService
    // Nếu không khớp, ném UnauthorizedException
    return true;
  }
}

// TODO 4: Hoàn thiện UsersController
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('db-config')
  getDbConfig() {
    return {
      databaseUrl: this.usersService.getDatabaseUrl(),
    };
  }
}
