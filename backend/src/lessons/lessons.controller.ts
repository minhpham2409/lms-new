import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a lesson' })
  create(@Body() dto: CreateLessonDto, @GetUser() user: { id: string }) {
    return this.lessonsService.create(dto, user.id);
  }

  /**
   * GET /lessons?sectionId=... — requires JWT for actual lesson content.
   * Returns only titles/metadata without content for unauthed.
   */
  @Get()
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Get lessons by section' })
  findAll(
    @Query('sectionId') sectionId: string,
    @Request() req: { user?: { id: string; role: string } },
  ) {
    return this.lessonsService.findAll(sectionId, req.user ?? null);
  }

  /**
   * GET /lessons/:id — requires JWT + enrollment for full content.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson by id' })
  findOne(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.lessonsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lesson' })
  update(@Param('id') id: string, @Body() dto: UpdateLessonDto, @GetUser() user: { id: string }) {
    return this.lessonsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete lesson' })
  remove(@Param('id') id: string, @GetUser() user: { id: string }) {
    return this.lessonsService.remove(id, user.id);
  }
}
