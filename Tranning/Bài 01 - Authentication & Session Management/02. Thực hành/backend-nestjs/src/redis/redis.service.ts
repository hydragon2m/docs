import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.client.on('connect', () => console.log('✅ [Redis] Đã kết nối thành công'));
    this.client.on('error', (err) => console.error('❌ [Redis Error]:', err.message));
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  /**
   * Lưu jti của Refresh Token vào Whitelist theo phiên (userId + deviceId)
   */
  async setSession(userId: string, deviceId: string, jti: string, ttlSeconds: number): Promise<void> {
    const key = `session:${userId}:${deviceId}`;
    await this.client.set(key, jti, 'EX', ttlSeconds);
  }

  /**
   * Lấy jti hiện tại của phiên
   */
  async getSession(userId: string, deviceId: string): Promise<string | null> {
    const key = `session:${userId}:${deviceId}`;
    return await this.client.get(key);
  }

  /**
   * Xóa phiên đơn lẻ (Đăng xuất trên thiết bị hiện tại)
   */
  async deleteSession(userId: string, deviceId: string): Promise<void> {
    const key = `session:${userId}:${deviceId}`;
    await this.client.del(key);
  }

  /**
   * Xóa toàn bộ phiên của người dùng (Đăng xuất mọi thiết bị / Kick-out khi phát hiện tấn công)
   * Sử dụng lệnh SCAN thay vì KEYS để chống nghẽn Event Loop trên Production!
   */
  async deleteAllSessions(userId: string): Promise<number> {
    const pattern = `session:${userId}:*`;
    let cursor = '0';
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.client.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    return deletedCount;
  }
}
