import { Controller, Get, Param, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { FilterBookDto } from './dto/filter-book.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // Xếp route tĩnh /categories lên TRƯỚC /:id
  @Get('categories')
  getCategories() {
    return this.booksService.getCategories();
  }

  @Get()
  findAll(@Query() query: FilterBookDto) {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }
}