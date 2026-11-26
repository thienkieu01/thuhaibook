import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterBookDto } from './dto/filter-book.dto';

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

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FilterBookDto) {
    const rawQuery = query as any;
    const {
      search,
      categoryId,
      authorId,
      publisherId,
      ageGroup,
    } = query;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const minPrice =
      query.minPrice !== undefined && query.minPrice !== null && String(query.minPrice) !== ''
        ? Number(query.minPrice)
        : undefined;
    const maxPrice =
      query.maxPrice !== undefined && query.maxPrice !== null && String(query.maxPrice) !== ''
        ? Number(query.maxPrice)
        : undefined;
    const minCondition =
      query.minCondition !== undefined && query.minCondition !== null && String(query.minCondition) !== ''
        ? Number(query.minCondition)
        : undefined;
    const maxCondition =
      rawQuery.maxCondition !== undefined && rawQuery.maxCondition !== null && String(rawQuery.maxCondition) !== ''
        ? Number(rawQuery.maxCondition)
        : undefined;

    const sortBy = String(rawQuery.sortBy || 'createdAt');
    const sortOrder: 'asc' | 'desc' =
      String(rawQuery.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const rawIsRecommended = rawQuery.isRecommended;
    const isRecommendedFilter =
      rawIsRecommended === true || rawIsRecommended === 'true'
        ? true
        : rawIsRecommended === false || rawIsRecommended === 'false'
          ? false
          : undefined;

    const conditionRangeFilter =
      minCondition !== undefined || maxCondition !== undefined
        ? {
            ConditionPercent: {
              ...(minCondition !== undefined && { gte: minCondition }),
              ...(maxCondition !== undefined && { lte: maxCondition }),
            },
          }
        : {};

    const priceRangeFilter =
      minPrice !== undefined || maxPrice !== undefined
        ? {
            Price: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {};

    const whereCondition: any = {
      Status: 'AVAILABLE',
      ...(isRecommendedFilter !== undefined && { IsRecommended: isRecommendedFilter }),
      ...(publisherId && { PublisherID: publisherId }),
      ...(ageGroup && { AgeGroup: ageGroup }),
      ...(categoryId && {
        bookCategories: { some: { CategoryID: categoryId } },
      }),
      ...(authorId && {
        bookAuthors: { some: { AuthorID: authorId } },
      }),
      copies: {
        some: {
          Status: 'AVAILABLE',
          ...priceRangeFilter,
          ...conditionRangeFilter,
        },
      },
    };

    const includeConfig = {
      publisher: true,
      bookAuthors: { include: { author: true } },
      bookCategories: { include: { category: true } },
      copies: {
        where: { Status: 'AVAILABLE' },
        include: { images: true },
        orderBy: { Price: 'asc' as const },
      },
    };

    const normalizedSearch = normalizeVietnamese(search);

    let matchedBooks = await this.prisma.books.findMany({
      where: whereCondition,
      include: includeConfig,
      orderBy: sortBy === 'createdAt' ? { CreatedAt: sortOrder } : { CreatedAt: 'desc' },
    });

    if (normalizedSearch) {
      matchedBooks = matchedBooks.filter((book: any) => {
        const titleMatch = normalizeVietnamese(book.Title).includes(normalizedSearch);
        const authorMatch = (book.bookAuthors || []).some((ba: any) =>
          normalizeVietnamese(ba.author?.Name).includes(normalizedSearch),
        );
        return titleMatch || authorMatch;
      });
    }

    const getMinPrice = (book: any) => {
      const prices = (book.copies || []).map((c: any) => Number(c.Price)).filter((p: number) => !Number.isNaN(p));
      return prices.length > 0 ? Math.min(...prices) : Number.MAX_SAFE_INTEGER;
    };

    const getMaxCondition = (book: any) => {
      const conds = (book.copies || []).map((c: any) => Number(c.ConditionPercent)).filter((v: number) => !Number.isNaN(v));
      return conds.length > 0 ? Math.max(...conds) : -1;
    };

    if (sortBy === 'price') {
      matchedBooks.sort((a, b) =>
        sortOrder === 'asc' ? getMinPrice(a) - getMinPrice(b) : getMinPrice(b) - getMinPrice(a),
      );
    } else if (sortBy === 'condition' || sortBy === 'conditionPercent') {
      matchedBooks.sort((a, b) =>
        sortOrder === 'asc' ? getMaxCondition(a) - getMaxCondition(b) : getMaxCondition(b) - getMaxCondition(a),
      );
    } else if (sortBy === 'createdAt') {
      matchedBooks.sort((a: any, b: any) => {
        const diff = new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime();
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    const total = matchedBooks.length;
    const paginatedBooks = matchedBooks.slice(skip, skip + limit);

    return {
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: paginatedBooks,
    };
  }

  async findOne(id: string) {
    const book = await this.prisma.books.findUnique({
      where: { BookID: id },
      include: {
        publisher: true,
        bookAuthors: { include: { author: true } },
        bookCategories: { include: { category: true } },
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