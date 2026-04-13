import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Comments')
@Controller('lessons/:lessonId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Post comment on lesson' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  create(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateCommentDto,
    @GetUser() user: any,
  ) {
    return this.commentsService.create(lessonId, dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments for lesson' })
  @ApiResponse({ status: 200, description: 'Comments retrieved' })
  findByLesson(@Param('lessonId') lessonId: string, @GetUser() user: any) {
    return this.commentsService.findByLesson(lessonId, user.id);
  }

  @Post(':commentId/reply')
  @ApiOperation({ summary: 'Reply to comment' })
  @ApiResponse({ status: 201, description: 'Reply created' })
  reply(
    @Param('lessonId') lessonId: string,
    @Param('commentId') commentId: string,
    @Body() dto: CreateCommentDto,
    @GetUser() user: any,
  ) {
    return this.commentsService.reply(lessonId, commentId, dto, user.id);
  }
}
