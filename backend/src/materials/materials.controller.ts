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
  create(@Body() dto: CreateMaterialDto, @GetUser() user: any) {
    return this.materialsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get materials by lesson' })
  @ApiResponse({ status: 200, description: 'Materials retrieved' })
  findByLesson(@Query('lessonId') lessonId: string) {
    return this.materialsService.findByLessonId(lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by id' })
  @ApiResponse({ status: 200, description: 'Material retrieved' })
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
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
    @GetUser() user: any,
  ) {
    return this.materialsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete material' })
  @ApiResponse({ status: 200, description: 'Material deleted' })
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.materialsService.remove(id, user.id);
  }
}
