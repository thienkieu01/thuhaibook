import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateAddressDto } from './dto/address.dto';

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
  async forgotPassword(dto: ForgotPasswordDto) {
  const user = await this.prisma.users.findFirst({
    where: {
      OR: [{ Email: dto.identifier }, { Phone: dto.identifier }],
    },
  });

  if (!user) {
    throw new NotFoundException('Không tìm thấy tài khoản với Email hoặc SĐT này');
  }

  /*if (user.Status === 'LOCKED') {
    throw new ForbiddenException('Tài khoản đã bị khóa, không thể đặt lại mật khẩu');
  }*/

  // Tạo mã token có chữ ký và hạn dùng 15 phút
  const resetToken = this.jwtService.sign(
    { sub: user.UserID, purpose: 'RESET_PASSWORD' },
    { expiresIn: '15m' },
  );

  // Giả lập gửi Email / SMS ra console để lấy mã test
  const channel = user.Email ? `Email (${user.Email})` : `SMS (${user.Phone})`;
  console.log(`[FR-03] Đã gửi mã đặt lại mật khẩu tới ${channel}: ${resetToken}`);

  return {
    message: `Mã/liên kết đặt lại mật khẩu có hiệu lực 15 phút đã được gửi qua ${channel}`,
    // Trả về token mẫu khi dev để tiện test trên Postman
    devResetToken: resetToken,
  };
}

async resetPassword(dto: ResetPasswordDto) {
  try {
    const payload = this.jwtService.verify(dto.token);
    if (payload.purpose !== 'RESET_PASSWORD') {
      throw new BadRequestException('Token không hợp lệ cho chức năng đặt lại mật khẩu');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.users.update({
      where: { UserID: payload.sub },
      data: { PasswordHash: hashedPassword },
    });

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại!' };
  } catch (error) {
    throw new BadRequestException('Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }
}
private validateHcmAddress(address: string) {
  const hcmRegex = /(tp\.?\s*hcm|hồ\s*chí\s*minh|ho\s*chi\s*minh|tphcm)/i;
  if (!hcmRegex.test(address)) {
    throw new BadRequestException(
      'Rất tiếc, cửa hàng hiện chỉ hỗ trợ giao hàng trong khu vực TP.HCM',
    );
  }
}

async getAddresses(userId: string) {
  const addresses = await this.prisma.addressesCustomer.findMany({
    where: { UserID: userId },
  });
  return {
    message: 'Lấy danh sách địa chỉ thành công',
    data: addresses.map((item) => item.Address),
  };
}

async addAddress(userId: string, address: string) {
  this.validateHcmAddress(address);

  const existed = await this.prisma.addressesCustomer.findUnique({
    where: { UserID_Address: { UserID: userId, Address: address } },
  });
  if (existed) {
    throw new BadRequestException('Địa chỉ này đã tồn tại trong sổ địa chỉ');
  }

  const created = await this.prisma.addressesCustomer.create({
    data: { UserID: userId, Address: address },
  });

  return { message: 'Thêm địa chỉ thành công', data: created };
}

async updateAddress(userId: string, dto: UpdateAddressDto) {
  this.validateHcmAddress(dto.newAddress);

  const existed = await this.prisma.addressesCustomer.findUnique({
    where: { UserID_Address: { UserID: userId, Address: dto.oldAddress } },
  });
  if (!existed) {
    throw new NotFoundException('Không tìm thấy địa chỉ cũ cần sửa');
  }

  // Vì Address là một phần của khóa chính kép, cập nhật bằng transaction xóa cũ - thêm mới
  const updated = await this.prisma.$transaction(async (tx) => {
    await tx.addressesCustomer.delete({
      where: { UserID_Address: { UserID: userId, Address: dto.oldAddress } },
    });
    return tx.addressesCustomer.create({
      data: { UserID: userId, Address: dto.newAddress },
    });
  });

  return { message: 'Cập nhật địa chỉ thành công', data: updated };
}

async deleteAddress(userId: string, address: string) {
  const existed = await this.prisma.addressesCustomer.findUnique({
    where: { UserID_Address: { UserID: userId, Address: address } },
  });
  if (!existed) {
    throw new NotFoundException('Không tìm thấy địa chỉ cần xóa');
  }

  await this.prisma.addressesCustomer.delete({
    where: { UserID_Address: { UserID: userId, Address: address } },
  });

  return { message: 'Xóa địa chỉ thành công' };
}
}