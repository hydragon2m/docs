import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

class LoginDto {
  email: string;
  pass: string;
  deviceId?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 1. Đăng nhập & Thiết lập HttpOnly Cookie
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const deviceId = dto.deviceId || req.headers['user-agent'] || 'unknown_browser';
    const result = await this.authService.login(dto.email, dto.pass, deviceId);

    // THIẾT LẬP COOKIE AN TOÀN TRÊN TRÌNH DUYỆT
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, // Chống 100% XSS (JavaScript không đọc được)
      secure: process.env.NODE_ENV === 'production', // Bắt buộc HTTPS trên Production
      sameSite: 'lax', // Chống CSRF hiệu quả
      path: '/', // Khả dụng trên toàn bộ trang
      maxAge: result.refreshTokenTtlSeconds * 1000, // Đổi sang mili-giây
    });

    // Trả về Access Token trong JSON Body (Client lưu trong Memory)
    return {
      message: 'Đăng nhập thành công',
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  /**
   * 2. Refresh Token Rotation (Trình duyệt tự động gửi Cookie)
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Đọc refresh token từ cookie do trình duyệt tự động đính kèm
    const refreshToken = req.cookies?.['refreshToken'];
    const result = await this.authService.refresh(refreshToken);

    // Ghi đè Cookie bằng Refresh Token mới (Rotate Token)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: result.refreshTokenTtlSeconds * 1000,
    });

    return {
      message: 'Làm mới phiên thành công',
      accessToken: result.accessToken,
    };
  }

  /**
   * 3. Đăng xuất trên thiết bị này (Xóa Cookie + Xóa Redis Session)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;
    const deviceId = req.headers['user-agent'] || 'unknown_browser';

    // 1. Xóa session trên Redis
    await this.authService.logout(userId, deviceId);

    // 2. Chỉ thị cho trình duyệt xóa cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Đã đăng xuất thành công khỏi thiết bị này' };
  }

  /**
   * 4. Đăng xuất khỏi mọi thiết bị (Kick-out toàn bộ)
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;
    await this.authService.logoutAll(userId);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Đã đăng xuất thành công khỏi tất cả các thiết bị' };
  }

  /**
   * 5. Endpoint dữ liệu được bảo vệ bởi Access Token
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return {
      message: 'Xác thực thành công với Access Token Stateless',
      user: req.user,
    };
  }
}
