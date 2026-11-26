import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

export class CreatePostInput {
  @IsOptional()
  @IsString()
  bookId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung bài viết không được để trống' })
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CreateCommentInput {
  @IsString()
  @IsNotEmpty({ message: 'Thiếu mã bài viết gốc' })
  postId: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

function normalizeVietnamese(text?: string | null): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function makeExcerpt(content: string, maxLength = 120): string {
  const clean = (content || '').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // FR-12: Danh sách đầu sách có ít nhất 1 bài đã duyệt, hoặc xem dòng thời gian theo 1 đầu sách
  async getPosts(filters?: {
    bookId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const sortBy = filters?.sortBy || 'latestActivity';
    const order: 'asc' | 'desc' =
      String(filters?.sortOrder || (filters?.bookId ? 'asc' : 'desc')).toLowerCase() === 'asc'
        ? 'asc'
        : 'desc';

    if (filters?.bookId) {
      const timelinePosts = await this.prisma.blogPosts.findMany({
        where: {
          BookID: filters.bookId,
          ParentID: null,
          Status: 'PUBLISHED',
        },
        include: {
          user: {
            select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true },
          },
          book: {
            select: {
              BookID: true,
              Title: true,
              CoverImage: true,
              copies: { where: { Status: 'AVAILABLE' }, select: { CopyID: true } },
            },
          },
          images: true,
          children: {
            where: { Status: 'PUBLISHED' },
            include: {
              user: { select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true } },
              children: {
                where: { Status: 'PUBLISHED' },
                include: {
                  user: { select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true } },
                },
                orderBy: { CreatedAt: 'asc' },
              },
            },
            orderBy: { CreatedAt: 'asc' },
          },
          _count: {
            select: {
              likes: true,
              children: { where: { Status: 'PUBLISHED' } } as any,
            },
          },
        },
        orderBy: { CreatedAt: order },
      });

      const normalizedSearch = normalizeVietnamese(filters?.search);
      const filtered = normalizedSearch
        ? timelinePosts.filter(
            (p: any) =>
              normalizeVietnamese(p.Content).includes(normalizedSearch) ||
              normalizeVietnamese(p.book?.Title).includes(normalizedSearch),
          )
        : timelinePosts;

      return { success: true, data: filtered };
    }

    const publishedPosts = await this.prisma.blogPosts.findMany({
      where: {
        Status: 'PUBLISHED',
        BookID: { not: null },
      },
      include: {
        user: {
          select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true },
        },
        book: {
          select: {
            BookID: true,
            Title: true,
            CoverImage: true,
            copies: {
              where: { Status: 'AVAILABLE' },
              select: { CopyID: true },
            },
          },
        },
        images: true,
        _count: {
          select: { likes: true, children: true },
        },
      },
      orderBy: { CreatedAt: 'desc' },
    });

    const groupedByBook = new Map<string, any>();

    for (const post of publishedPosts as any[]) {
      if (!post.BookID || !post.book) continue;

      const isReply = Boolean(post.ParentID);
      const likesCount = post._count?.likes ?? 0;
      const postTime = new Date(post.CreatedAt).getTime();

      if (!groupedByBook.has(post.BookID)) {
        groupedByBook.set(post.BookID, {
          bookId: post.BookID,
          bookTitle: post.book.Title,
          coverImage: post.book.CoverImage,
          isOutOfStock: (post.book.copies?.length ?? 0) === 0,
          latestPostId: post.PostID,
          latestContent: post.Content,
          latestExcerpt: makeExcerpt(post.Content),
          latestPostAt: post.CreatedAt,
          lastActivityAt: post.CreatedAt,
          _lastActivityTs: postTime,
          likesCount: 0,
          repliesCount: 0,
          postsCount: 0,
          posts: [],
        });
      }

      const entry = groupedByBook.get(post.BookID);
      entry.likesCount += likesCount;

      if (isReply) {
        entry.repliesCount += 1;
      } else {
        entry.postsCount += 1;
        entry.posts.push(post);
      }

      if (postTime > entry._lastActivityTs) {
        entry._lastActivityTs = postTime;
        entry.lastActivityAt = post.CreatedAt;
        if (!isReply) {
          entry.latestPostId = post.PostID;
          entry.latestContent = post.Content;
          entry.latestExcerpt = makeExcerpt(post.Content);
          entry.latestPostAt = post.CreatedAt;
        }
      }
    }

    let items = Array.from(groupedByBook.values()).map(({ _lastActivityTs, ...rest }) => ({
      ...rest,
      _sortTs: _lastActivityTs,
    }));

    const normalizedSearch = normalizeVietnamese(filters?.search);
    if (normalizedSearch) {
      items = items.filter((item) => {
        const bookMatch = normalizeVietnamese(item.bookTitle).includes(normalizedSearch);
        const contentMatch = normalizeVietnamese(item.latestContent).includes(normalizedSearch);
        const anyPostMatch = (item.posts || []).some((p: any) =>
          normalizeVietnamese(p.Content).includes(normalizedSearch),
        );
        return bookMatch || contentMatch || anyPostMatch;
      });
    }

    items.sort((a, b) => {
      if (sortBy === 'likes') {
        return order === 'asc' ? a.likesCount - b.likesCount : b.likesCount - a.likesCount;
      }
      if (sortBy === 'replies') {
        return order === 'asc' ? a.repliesCount - b.repliesCount : b.repliesCount - a.repliesCount;
      }
      if (sortBy === 'title') {
        const cmp = String(a.bookTitle).localeCompare(String(b.bookTitle), 'vi');
        return order === 'asc' ? cmp : -cmp;
      }
      return order === 'asc' ? a._sortTs - b._sortTs : b._sortTs - a._sortTs;
    });

    const formatted = items.map(({ _sortTs, ...rest }) => rest);

    return { success: true, data: formatted };
  }

  async reportPost(userId: string, postId: string, reason?: string) {
    const post = await this.prisma.blogPosts.findUnique({
      where: { PostID: postId },
    });

    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    console.log(
      `[REPORT BLOG] User ${userId} báo cáo bài viết ${postId}. Lý do: ${reason || 'Nội dung không phù hợp'}`,
    );

    return {
      success: true,
      message: 'Đã gửi báo cáo nội dung thành công. Quản trị viên sẽ xem xét bài viết này.',
    };
  }

  async getPostDetail(postId: string, userId?: string) {
    const post = await this.prisma.blogPosts.findUnique({
      where: { PostID: postId },
      include: {
        user: { select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true } },
        book: { select: { BookID: true, Title: true, CoverImage: true } },
        images: true,
        children: {
          where: { Status: 'PUBLISHED' },
          include: {
            user: { select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true } },
            children: {
              where: { Status: 'PUBLISHED' },
              include: {
                user: { select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true } },
              },
              orderBy: { CreatedAt: 'asc' },
            },
          },
          orderBy: { CreatedAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            children: { where: { Status: 'PUBLISHED' } } as any,
          },
        },
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

  // FR-21: Bài mới tạo lưu trạng thái chờ duyệt ('PENDING')
  async createPost(userId: string, dto: CreatePostInput) {
    if (dto.bookId) {
      const book = await this.prisma.books.findUnique({ where: { BookID: dto.bookId } });
      if (!book) throw new NotFoundException('Đầu sách được chọn không tồn tại');
    }

    const urls = dto.imageUrls ?? dto.images ?? [];

    const post = await this.prisma.blogPosts.create({
      data: {
        UserID: userId,
        BookID: dto.bookId || null,
        Content: dto.content,
        Status: 'PENDING',
        images:
          urls.length > 0
            ? { create: urls.map((url) => ({ ImageUrl: url })) }
            : undefined,
      },
      include: { images: true, book: true },
    });

    return {
      success: true,
      message: 'Đăng bài blog thành công, bài viết đang chờ duyệt',
      data: post,
    };
  }

  // FR-22: Bài nối tiếp lưu trạng thái chờ duyệt ('PENDING')
  async createComment(userId: string, dto: CreateCommentInput) {
    const targetParentId = dto.parentId || dto.postId;
    if (!targetParentId) {
      throw new BadRequestException('Thiếu mã bài viết gốc');
    }

    const parentPost = await this.prisma.blogPosts.findUnique({
      where: { PostID: targetParentId },
    });

    if (!parentPost) {
      throw new NotFoundException('Bài viết hoặc bình luận gốc không tồn tại');
    }

    const comment = await this.prisma.blogPosts.create({
      data: {
        UserID: userId,
        ParentID: targetParentId,
        BookID: parentPost.BookID,
        Content: dto.content,
        Status: 'PENDING',
      },
      include: {
        user: { select: { UserID: true, Username: true, Avatar: true, FirstName: true, LastName: true } },
      },
    });

    return {
      success: true,
      message: 'Đã gửi bài nối tiếp, đang chờ duyệt',
      data: comment,
    };
  }

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

  async getMyPosts(userId: string) {
    const posts = await this.prisma.blogPosts.findMany({
      where: { UserID: userId },
      orderBy: { CreatedAt: 'desc' },
      include: {
        book: {
          select: { BookID: true, Title: true, CoverImage: true },
        },
        images: true,
        _count: {
          select: { likes: true, children: true },
        },
      },
    });

    return {
      message: 'Lấy danh sách bài đăng của bạn thành công',
      data: posts,
    };
  }
}