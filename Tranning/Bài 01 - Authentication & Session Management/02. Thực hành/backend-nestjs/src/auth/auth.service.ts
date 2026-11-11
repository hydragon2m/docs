import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { randomUUID } from 'crypto';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload extends UserPayload {
  jti: string;
  deviceId: string;
}

@Injectable()
export class AuthService {
  // Cấu hình thời gian sống chuẩn Production
  private readonly ACCESS_TOKEN_TTL = '15m'; // 15 phút (Stateless)
  private readonly REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 ngày (Lưu Redis)

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 1. Đăng nhập người dùng & Khởi tạo cặp token cùng jti Whitelist
   */
  async login(email: string, pass: string, deviceId = 'default_browser') {
    // Giả lập kiểm tra Database (Demo)
    if (email !== 'admin@example.com' || pass !== 'Password123@') {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const user: UserPayload = {
      userId: 'usr_998877',
      email: 'admin@example.com',
      role: 'ADMIN',
    };

    return await this.generateTokenPair(user, deviceId);
  }

  /**
   * 2. Refresh Token Rotation & Phát hiện tấn công tái sử dụng token (Replay Attack)
   */
  async refresh(refreshTokenString: string) {
    if (!refreshTokenString) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token trong Cookie');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshTokenString, {
        secret: process.env.JWT_REFRESH_SECRET || 'SUPER_SECRET_REFRESH_KEY',
      });
    } catch {
      throw new UnauthorizedException('Refresh Token đã hết hạn hoặc chữ ký không hợp lệ');
    }

    const { userId, deviceId, jti } = payload;

    // BƯỚC QUAN TRỌNG: Kiểm tra jti trong Redis Whitelist
    const storedJti = await this.redisService.getSession(userId, deviceId);

    if (!storedJti) {
      // Phiên không tồn tại (đã logout hoặc hết hạn trên Redis)
      throw new UnauthorizedException('Phiên đăng nhập không tồn tại hoặc đã bị thu hồi');
    }

    // 🚨 PHÁT HIỆN REPLAY ATTACK (TÁI SỬ DỤNG TOKEN CŨ)
    if (storedJti !== jti) {
      console.error(
        `🚨 [SECURITY ALERT] Phát hiện Refresh Token bị sử dụng lại cho User: ${userId}, Device: ${deviceId}! ` +
        `Token JTI gửi lên: ${jti}, JTI hiện tại trong Redis: ${storedJti}. ` +
        `HỦY TOÀN BỘ PHIÊN CỦA USER NGAY LẬP TỨC!`,
      );

      // Kích hoạt cơ chế tự vệ: Xóa sạch toàn bộ phiên của người dùng trên mọi thiết bị
      await this.redisService.deleteAllSessions(userId);

      throw new UnauthorizedException(
        'Phát hiện hành vi bất thường (Token reuse detected). Để bảo vệ tài khoản, toàn bộ phiên đã bị đăng xuất!',
      );
    }

    // NẾU HỢP LỆ: Tạo cặp token mới (Token Rotation)
    const user: UserPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    return await this.generateTokenPair(user, deviceId);
  }

  /**
   * 3. Đăng xuất thiết bị hiện tại (Single Logout)
   */
  async logout(userId: string, deviceId: string) {
    await this.redisService.deleteSession(userId, deviceId);
    return { success: true, message: 'Đăng xuất thiết bị hiện tại thành công' };
  }

  /**
   * 4. Đăng xuất tất cả thiết bị (Kick-out All Sessions)
   */
  async logoutAll(userId: string) {
    const deletedCount = await this.redisService.deleteAllSessions(userId);
    return { success: true, message: `Đã hủy toàn bộ ${deletedCount} phiên đăng nhập trên mọi thiết bị` };
  }

  /**
   * Helper: Tạo Access Token + Refresh Token & Lưu jti vào Redis Whitelist
   */
  private async generateTokenPair(user: UserPayload, deviceId: string) {
    // 1. Sinh jti duy nhất (UUID v4)
    const jti = randomUUID();

    // 2. Ký Access Token (Stateless - TTL 15m)
    const accessToken = this.jwtService.sign(
      {
        sub: user.userId,
        email: user.email,
        role: user.role,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'SUPER_SECRET_ACCESS_KEY',
        expiresIn: this.ACCESS_TOKEN_TTL,
      },
    );

    // 3. Ký Refresh Token (Mang theo jti và deviceId)
    const refreshToken = this.jwtService.sign(
      {
        sub: user.userId,
        email: user.email,
        role: user.role,
        deviceId,
        jti,
      },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'SUPER_SECRET_REFRESH_KEY',
        expiresIn: `${this.REFRESH_TOKEN_TTL_SECONDS}s`,
      },
    );

    // 4. Lưu jti vào Redis Whitelist với TTL 7 ngày
    await this.redisService.setSession(user.userId, deviceId, jti, this.REFRESH_TOKEN_TTL_SECONDS);

    return {
      user,
      accessToken,
      refreshToken,
      refreshTokenTtlSeconds: this.REFRESH_TOKEN_TTL_SECONDS,
    };
  }
}
