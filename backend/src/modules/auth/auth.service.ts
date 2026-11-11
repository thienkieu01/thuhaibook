import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.users.findFirst({
      where: {
        OR: [{ Email: dto.email }, { Phone: dto.phone }, { Username: dto.username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email, Số điện thoại hoặc Tên đăng nhập đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        Username: dto.username,
        FirstName: dto.firstName,
        LastName: dto.lastName,
        Email: dto.email,
        Phone: dto.phone,
        PasswordHash: hashedPassword,
        Role: 'USER',
        Status: 'ACTIVE',
      },
    });

    const payload = { sub: user.UserID, role: user.Role };
    return {
      message: 'Đăng ký tài khoản thành công',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        fullName: `${user.FirstName} ${user.LastName}`,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findFirst({
      where: {
        OR: [
          { Email: dto.usernameOrEmail },
          { Phone: dto.usernameOrEmail },
          { Username: dto.usernameOrEmail },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.PasswordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    if (user.Status === 'LOCKED') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
    }

    const payload = { sub: user.UserID, role: user.Role };
    return {
      message: 'Đăng nhập thành công',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        phone: user.Phone,
        fullName: `${user.FirstName} ${user.LastName}`,
        role: user.Role,
      },
    };
  }

  // HÀM CẬP NHẬT THÔNG TIN CÁ NHÂN (FR-06)
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.users.findUnique({ where: { UserID: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    if (dto.email || dto.phone) {
      const conflict = await this.prisma.users.findFirst({
        where: {
          UserID: { not: userId },
          OR: [
            ...(dto.email ? [{ Email: dto.email }] : []),
            ...(dto.phone ? [{ Phone: dto.phone }] : []),
          ],
        },
      });

      if (conflict) {
        throw new BadRequestException('Email hoặc Số điện thoại đã được sử dụng bởi tài khoản khác');
      }
    }

    const updatedUser = await this.prisma.users.update({
      where: { UserID: userId },
      data: {
        ...(dto.firstName && { FirstName: dto.firstName }),
        ...(dto.lastName && { LastName: dto.lastName }),
        ...(dto.email && { Email: dto.email }),
        ...(dto.phone && { Phone: dto.phone }),
        ...(dto.avatar !== undefined && { Avatar: dto.avatar }),
      },
    });

    return {
      message: 'Cập nhật thông tin thành công',
      user: {
        id: updatedUser.UserID,
        username: updatedUser.Username,
        firstName: updatedUser.FirstName,
        lastName: updatedUser.LastName,
        email: updatedUser.Email,
        phone: updatedUser.Phone,
        avatar: updatedUser.Avatar,
      },
    };
  }

  // HÀM ĐỔI MẬT KHẨU (FR-07)
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({ where: { UserID: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.PasswordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const newHashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.users.update({
      where: { UserID: userId },
      data: { PasswordHash: newHashedPassword },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }
}