import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import { LinkChildDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Parents')
@Controller('parents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post('link-child')
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Send link request to child' })
  @ApiResponse({ status: 201, description: 'Link request sent' })
  linkChild(@Body() dto: LinkChildDto, @GetUser() user: any) {
    return this.parentsService.linkChild(dto, user.id);
  }

  @Post('link-request/:id/accept')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'Accept parent link request' })
  @ApiResponse({ status: 200, description: 'Link accepted' })
  acceptLink(@Param('id') id: string, @GetUser() user: any) {
    return this.parentsService.acceptLink(id, user.id);
  }

  @Get('me/children')
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Get linked children' })
  @ApiResponse({ status: 200, description: 'Children retrieved' })
  getChildren(@GetUser() user: any) {
    return this.parentsService.getChildren(user.id);
  }

  @Get('children/:id/progress')
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Get child learning progress' })
  @ApiResponse({ status: 200, description: 'Progress retrieved' })
  getChildProgress(@Param('id') childId: string, @GetUser() user: any) {
    return this.parentsService.getChildProgress(user.id, childId);
  }

  @Get('children/:id/courses')
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Get child enrolled courses' })
  @ApiResponse({ status: 200, description: 'Courses retrieved' })
  getChildCourses(@Param('id') childId: string, @GetUser() user: any) {
    return this.parentsService.getChildCourses(user.id, childId);
  }
}
