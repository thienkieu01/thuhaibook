import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterBookDto } from './dto/filter-book.dto';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FilterBookDto) {
    const {
      search,
      categoryId,
      authorId,
      publisherId,
      ageGroup,
      minPrice,
      maxPrice,
      minCondition,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Đơn hàng điều kiện tìm kiếm
    const whereCondition: any = {
      Status: 'AVAILABLE',
      ...(publisherId && { PublisherID: publisherId }),
      ...(ageGroup && { AgeGroup: ageGroup }),
      ...(categoryId && {
        bookCategories: { some: { CategoryID: categoryId } },
      }),
      ...(authorId && {
        bookAuthors: { some: { AuthorID: authorId } },
      }),
      // FR-13: Tìm theo tên sách hoặc tên tác giả
      ...(search && {
        OR: [
          { Title: { contains: search, mode: 'insensitive' } },
          {
            bookAuthors: {
              some: {
                author: { Name: { contains: search, mode: 'insensitive' } },
              },
            },
          },
        ],
      }),
      // BR-12 & FR-12: Chỉ lấy Đầu sách có ít nhất 1 Bản sách đang AVAILABLE
      copies: {
        some: {
          Status: 'AVAILABLE',
          ...(minPrice || maxPrice
            ? {
                Price: {
                  ...(minPrice && { gte: minPrice }),
                  ...(maxPrice && { lte: maxPrice }),
                },
              }
            : {}),
          ...(minCondition && { ConditionPercent: { gte: minCondition } }),
        },
      },
    };

    // Đếm tổng số bản ghi phục vụ Phân trang
    const total = await this.prisma.books.count({ where: whereCondition });

    // Truy vấn dữ liệu
    const books = await this.prisma.books.findMany({
      where: whereCondition,
      include: {
        publisher: true,
        bookAuthors: { include: { author: true } },
        bookCategories: { include: { category: true } },
        copies: {
          where: { Status: 'AVAILABLE' },
          include: { images: true },
          orderBy: { Price: 'asc' },
        },
      },
      skip,
      take: limit,
      orderBy: sortBy === 'createdAt' ? { CreatedAt: sortOrder } : undefined,
    });

    return {
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: books,
    };
  }

  async findOne(id: string) {
    const book = await this.prisma.books.findUnique({
      where: { BookID: id },
      include: {
        publisher: true,
        bookAuthors: { include: { author: true } },
        bookCategories: { include: { category: true } },
        // FR-16 & BR-12: Trả về cả bản sách để Frontend báo "Hết hàng" nếu mảng copies rỗng
        copies: {
          include: { images: true },
          orderBy: { ConditionPercent: 'desc' },
        },
        reviews: {
          include: {
            user: {
              select: { UserID: true, Username: true, Avatar: true, FirstName: true },
            },
          },
          orderBy: { CreatedAt: 'desc' },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Không tìm thấy đầu sách này');
    }

    return { success: true, data: book };
  }

  async getCategories() {
    const categories = await this.prisma.categories.findMany({
      orderBy: { Name: 'asc' },
    });
    return { success: true, data: categories };
  }
}