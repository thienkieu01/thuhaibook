import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export class CreatePostInput {
  bookId?: string;
  content: string;
  imageUrls?: string[];
}

export class CreateCommentInput {
  postId: string;
  content: string;
  parentId?: string;
}

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // 1. Lấy danh sách các bài viết Blog chính (ParentID = null)
  async getPosts() {
    const posts = await this.prisma.blogPosts.findMany({
      where: { ParentID: null, Status: 'PUBLISHED' },
      include: {
        user: { select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true } },
        book: { select: { BookID: true, Title: true, CoverImage: true } },
        images: true,
        _count: { select: { likes: true, children: true } },
      },
      orderBy: { CreatedAt: 'desc' },
    });

    return { success: true, data: posts };
  }

  // 2. Lấy chi tiết bài viết Blog & bình luận lồng nhau
  async getPostDetail(postId: string, userId?: string) {
    const post = await this.prisma.blogPosts.findUnique({
      where: { PostID: postId },
      include: {
        user: { select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true } },
        book: { select: { BookID: true, Title: true, CoverImage: true } },
        images: true,
        children: {
          include: {
            user: { select: { UserID: true, Username: true, Avatar: true } },
            children: {
              include: { user: { select: { UserID: true, Username: true, Avatar: true } } },
              orderBy: { CreatedAt: 'asc' },
            },
          },
          orderBy: { CreatedAt: 'asc' },
        },
        _count: { select: { likes: true, children: true } },
      },
    });

    if (!post) throw new NotFoundException('Bài viết không tồn tại');

    let isLiked = false;
    if (userId) {
      const like = await this.prisma.likes.findUnique({
        where: { UserID_PostID: { UserID: userId, PostID: postId } },
      });
      isLiked = !!like;
    }

    return { success: true, data: { ...post, isLiked } };
  }

  // 3. Đăng bài viết Blog mới
  async createPost(userId: string, dto: CreatePostInput) {
    if (dto.bookId) {
      const book = await this.prisma.books.findUnique({ where: { BookID: dto.bookId } });
      if (!book) throw new NotFoundException('Đầu sách được chọn không tồn tại');
    }

    const post = await this.prisma.blogPosts.create({
      data: {
        UserID: userId,
        BookID: dto.bookId || null,
        Content: dto.content,
        Status: 'PUBLISHED',
        images: dto.imageUrls && dto.imageUrls.length > 0 ? {
          create: dto.imageUrls.map((url) => ({ ImageUrl: url })),
        } : undefined,
      },
      include: { images: true, book: true },
    });

    return { success: true, message: 'Đăng bài blog thành công', data: post };
  }

  // 4. Bình luận hoặc trả lời bình luận (Lưu vào BlogPosts dạng đệ quy ParentID)
  async createComment(userId: string, dto: CreateCommentInput) {
    const parentPost = await this.prisma.blogPosts.findUnique({
      where: { PostID: dto.parentId || dto.postId },
    });

    if (!parentPost) throw new NotFoundException('Bài viết hoặc bình luận gốc không tồn tại');

    const comment = await this.prisma.blogPosts.create({
      data: {
        UserID: userId,
        ParentID: dto.parentId || dto.postId,
        BookID: parentPost.BookID,
        Content: dto.content,
        Status: 'PUBLISHED',
      },
      include: {
        user: { select: { UserID: true, Username: true, Avatar: true } },
      },
    });

    return { success: true, message: 'Đã gửi bình luận', data: comment };
  }

  // 5. Thích / Bỏ thích bài viết
  async toggleLike(userId: string, postId: string) {
    const existing = await this.prisma.likes.findUnique({
      where: { UserID_PostID: { UserID: userId, PostID: postId } },
    });

    if (existing) {
      await this.prisma.likes.delete({
        where: { UserID_PostID: { UserID: userId, PostID: postId } },
      });
      return { success: true, isLiked: false };
    }

    await this.prisma.likes.create({
      data: { UserID: userId, PostID: postId },
    });

    return { success: true, isLiked: true };
  }
}