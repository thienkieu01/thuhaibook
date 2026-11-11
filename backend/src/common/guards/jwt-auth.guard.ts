import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
    // Tự động chặn nếu tài khoản bị khóa (FR-03)
    if (user.isLocked) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
    }
    return user;
  }
}