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
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sections')
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create section' })
  @ApiResponse({ status: 201, description: 'Section created' })
  create(@Body() createSectionDto: CreateSectionDto, @GetUser() user: any) {
    return this.sectionsService.create(createSectionDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get sections by course' })
  @ApiResponse({ status: 200, description: 'Sections retrieved' })
  findByCourse(@Query('courseId') courseId: string) {
    return this.sectionsService.findByCourseId(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get section by id' })
  @ApiResponse({ status: 200, description: 'Section retrieved' })
  findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update section' })
  @ApiResponse({ status: 200, description: 'Section updated' })
  update(
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
    @GetUser() user: any,
  ) {
    return this.sectionsService.update(id, updateSectionDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete section' })
  @ApiResponse({ status: 200, description: 'Section deleted' })
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.sectionsService.remove(id, user.id);
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder sections' })
  @ApiResponse({ status: 200, description: 'Sections reordered' })
  reorder(
    @Query('courseId') courseId: string,
    @Body() reorderDto: ReorderSectionsDto,
    @GetUser() user: any,
  ) {
    return this.sectionsService.reorder(courseId, reorderDto, user.id);
  }
}
