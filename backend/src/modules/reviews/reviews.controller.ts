import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateReviewDto, GetReviewsQueryDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Public API: Xem danh sách đánh giá theo BookID (FR-18)
  @Get('book/:bookId')
  getReviewsByBook(@Param('bookId') bookId: string, @Query() query: GetReviewsQueryDto) {
    return this.reviewsService.getReviewsByBook(bookId, query);
  }

  // Require Login: Tạo đánh giá mới (FR-35, BR-07)
  @UseGuards(AuthGuard('jwt'))
  @Post()
  createReview(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.UserID, dto);
  }

  // Require Login: Sửa đánh giá của chính mình (FR-36)
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  updateReview(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.updateReview(req.user.UserID, id, dto);
  }

  // Require Login: Xóa đánh giá của chính mình (FR-36)
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  deleteReview(@Request() req: any, @Param('id') id: string) {
    return this.reviewsService.deleteReview(req.user.UserID, id);
  }
}