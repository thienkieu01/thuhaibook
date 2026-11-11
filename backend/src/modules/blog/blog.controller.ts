import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BlogService, CreateCommentInput, CreatePostInput } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  getPosts() {
    return this.blogService.getPosts();
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

  @Get(':id')
  getPostDetail(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.blogService.getPostDetail(id, userId);
  }
}