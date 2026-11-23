import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, GetReviewsQueryDto, UpdateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // FR-18: Lấy danh sách đánh giá của 1 đầu sách kèm tính số sao trung bình & phân trang
  async getReviewsByBook(bookId: string, query: GetReviewsQueryDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const book = await this.prisma.books.findUnique({
      where: { BookID: bookId },
    });
    if (!book) {
      throw new NotFoundException('Đầu sách không tồn tại');
    }

    const [total, reviews, aggregate] = await Promise.all([
      this.prisma.reviews.count({ where: { BookID: bookId } }),
      this.prisma.reviews.findMany({
        where: { BookID: bookId },
        include: {
          user: {
    select: { UserID: true, Username: true, FirstName: true, LastName: true, Avatar: true },
  },
  copy: {
    select: { CopyID: true, ConditionPercent: true, DamageDescription: true },
  },
        },
        skip,
        take: limit,
        orderBy: { CreatedAt: 'desc' },
      }),
      this.prisma.reviews.aggregate({
        where: { BookID: bookId },
        _avg: { Rating: true },
      }),
    ]);

    const averageRating = aggregate._avg.Rating
      ? Number(aggregate._avg.Rating.toFixed(1))
      : 0;

    return {
      success: true,
      summary: {
        totalReviews: total,
        averageRating,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: reviews,
    };
  }

  // FR-35, BR-07: Tạo đánh giá mới (Kiểm tra người dùng có đơn hàng chứa bản sao thuộc đầu sách đó chưa)
  // 1. Tạo đánh giá gắn với từng bản copy đã giao thành công
// 1. Tạo đánh giá gắn với từng bản copy đã giao thành công
async createReview(userId: string, dto: CreateReviewDto) {
  // Kiểm tra User có mua đúng bản CopyID này trong một đơn đã giao (COMPLETED) chưa
  const purchasedOrder = await this.prisma.orders.findFirst({
    where: {
      UserID: userId,
      Status: 'COMPLETED', // Khớp với điều kiện "đơn đã giao thành công"
      orderBookCopies: {
        some: { CopyID: dto.copyId },
      },
    },
    include: {
      orderBookCopies: {
        where: { CopyID: dto.copyId },
        include: { copy: true },
      },
    },
  });

  if (!purchasedOrder) {
    throw new BadRequestException(
      'Bạn chỉ có thể đánh giá bản sách này sau khi đơn hàng đã được giao thành công.',
    );
  }

  // Kiểm tra bản sao này đã được đánh giá chưa
  const existingReview = await this.prisma.reviews.findUnique({
    where: { CopyID: dto.copyId },
  });

  if (existingReview) {
    throw new BadRequestException('Bản sách này đã được đánh giá trước đó.');
  }

  const bookId = purchasedOrder.orderBookCopies[0].copy.BookID;

  const newReview = await this.prisma.reviews.create({
    data: {
      UserID: userId,
      BookID: bookId,
      CopyID: dto.copyId,
      Rating: dto.rating,
      Comment: dto.comment ?? '',
    },
    include: {
      user: {
        select: { UserID: true, Username: true, FirstName: true, LastName: true, Avatar: true },
      },
      copy: {
        select: { CopyID: true, ConditionPercent: true, Price: true },
      },
    },
  });

  return {
    success: true,
    message: 'Gửi đánh giá cho bản sách thành công',
    data: newReview,
  };
}
  // FR-36: Chỉnh sửa đánh giá của chính mình
  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.reviews.findUnique({
      where: { ReviewsID: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá này');
    }

    if (review.UserID !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa đánh giá này');
    }

    const updatedReview = await this.prisma.reviews.update({
      where: { ReviewsID: reviewId },
      data: {
        Rating: dto.rating,
        Comment: dto.comment,
      },
      include: {
        user: {
          select: {
            UserID: true,
            Username: true,
            FirstName: true,
            LastName: true,
            Avatar: true,
          },
        },
        copy: {
        select: { CopyID: true, ConditionPercent: true, Price: true },
      },
      },
    });

    return {
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: updatedReview,
    };
  }

  // FR-36: Xóa đánh giá của chính mình
  async deleteReview(userId: string, reviewId: string) {
    const review = await this.prisma.reviews.findUnique({
      where: { ReviewsID: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá này');
    }

    if (review.UserID !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.prisma.reviews.delete({
      where: { ReviewsID: reviewId },
    });

    return {
      success: true,
      message: 'Đã xóa đánh giá thành công',
    };
  }
}