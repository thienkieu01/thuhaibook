import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

// FR-37 & BR-11: Tạo bài viết Blog
export class CreateBlogDto {
  @IsString()
  @IsNotEmpty({ message: 'Bài blog bắt buộc phải gắn với 1 đầu sách' })
  bookId: string;

  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề bài viết không được để trống' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung bài viết không được để trống' })
  content: string;

  @IsOptional()
  @IsString()
  coverImage?: string;
}

// FR-38: Bình luận lồng nhau (ParentID)
export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã bài viết không được để trống' })
  postId: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string; // Nhập CommentID nếu là trả lời bình luận khác
}

// FR-39: Báo cáo nội dung vi phạm
export enum ReportTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
}

export class ReportContentDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsString()
  @IsNotEmpty({ message: 'Mã đối tượng báo cáo không được để trống' })
  targetId: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng cung cấp lý do báo cáo' })
  reason: string;
}

// FR-35: Tạo đánh giá sách
export class CreateReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn đầu sách cần đánh giá' })
  bookId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung nhận xét không được để trống' })
  comment: string;
}

// FR-36: Sửa đánh giá
export class UpdateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung nhận xét không được để trống' })
  comment: string;
}

// FR-19: Lọc danh sách Blog
export class FilterBlogDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  bookId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}