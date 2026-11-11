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
            select: {
              UserID: true,
              Username: true,
              FirstName: true,
              LastName: true,
              Avatar: true,
            },
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
  async createReview(userId: string, dto: CreateReviewDto) {
    // BR-07: Kiểm tra ràng buộc mua hàng qua bảng Orders & OrderBookCopies
    const hasPurchased = await this.prisma.orders.findFirst({
      where: {
        UserID: userId,
        orderBookCopies: {
          some: {
            copy: {
              BookID: dto.bookId,
            },
          },
        },
      },
    });

    if (!hasPurchased) {
      throw new BadRequestException(
        'Bạn chỉ có thể đánh giá đầu sách này sau khi đã mua thành công ít nhất một bản sách thuộc đầu sách đó.',
      );
    }

    // Kiểm tra xem người dùng đã gửi đánh giá cho đầu sách này chưa
    const existingReview = await this.prisma.reviews.findFirst({
      where: { UserID: userId, BookID: dto.bookId },
    });

    if (existingReview) {
      throw new BadRequestException(
        'Bạn đã gửi đánh giá cho đầu sách này rồi. Vui lòng sử dụng tính năng chỉnh sửa đánh giá.',
      );
    }

    const newReview = await this.prisma.reviews.create({
      data: {
        UserID: userId,
        BookID: dto.bookId,
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
      },
    });

    return {
      success: true,
      message: 'Gửi đánh giá thành công',
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