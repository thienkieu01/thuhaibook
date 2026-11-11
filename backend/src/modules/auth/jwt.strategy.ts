import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'THU_HAI_SECRET_KEY',
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.prisma.users.findUnique({
      where: { UserID: payload.sub },
      select: {
        UserID: true,
        Username: true,
        Email: true,
        Phone: true,
        FirstName: true,
        LastName: true,
        Role: true,
        Status: true,
        Avatar: true,
      },
    });

    if (!user || user.Status === 'LOCKED') {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    return user;
  }
}