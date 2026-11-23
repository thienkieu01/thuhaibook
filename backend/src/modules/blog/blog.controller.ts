import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BlogService, CreateCommentInput, CreatePostInput } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  getPosts(
    @Query('bookId') bookId?: string,
    @Query('search') search?: string,
  ) {
    return this.blogService.getPosts({ bookId, search });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('comments')
  createComment(@Request() req: any, @Body() dto: CreateCommentInput) {
    return this.blogService.createComment(req.user.UserID, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  createPost(@Request() req: any, @Body() dto: CreatePostInput) {
    return this.blogService.createPost(req.user.UserID, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/like')
  toggleLike(@Request() req: any, @Param('id') postId: string) {
    return this.blogService.toggleLike(req.user.UserID, postId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/report')
  reportPost(
    @Request() req: any,
    @Param('id') postId: string,
    @Body('reason') reason: string,
  ) {
    return this.blogService.reportPost(req.user.UserID, postId, reason);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-posts')
  getMyPosts(@Request() req: any) {
    return this.blogService.getMyPosts(req.user.UserID);
  }

  @Get(':id')
  getPostDetail(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.blogService.getPostDetail(id, userId);
  }
}