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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add material to lesson' })
  @ApiResponse({ status: 201, description: 'Material created' })
  create(@Body() dto: CreateMaterialDto, @GetUser() user: { id: string; role: string }) {
    return this.materialsService.create(dto, user);
  }

  /**
   * GET /materials?lessonId=... — requires JWT + enrollment.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get materials by lesson' })
  @ApiResponse({ status: 200, description: 'Materials retrieved' })
  findByLesson(
    @Query('lessonId') lessonId: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.materialsService.findByLessonId(lessonId, user);
  }

  /**
   * GET /materials/:id — requires JWT + enrollment.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get material by id' })
  @ApiResponse({ status: 200, description: 'Material retrieved' })
  findOne(
    @Param('id') id: string,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.materialsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update material' })
  @ApiResponse({ status: 200, description: 'Material updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.materialsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete material' })
  @ApiResponse({ status: 200, description: 'Material deleted' })
  remove(@Param('id') id: string, @GetUser() user: { id: string; role: string }) {
    return this.materialsService.remove(id, user);
  }
}
