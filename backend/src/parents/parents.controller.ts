import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
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

  @Post('link-request/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'Decline parent link request' })
  @ApiResponse({ status: 200 })
  rejectLink(@Param('id') id: string, @GetUser() user: any) {
    return this.parentsService.rejectIncomingLink(user.id, id);
  }

  @Delete('link-requests/:id')
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Cancel a pending link request (parent)' })
  cancelOutgoing(@Param('id') id: string, @GetUser() user: any) {
    return this.parentsService.cancelOutgoingLink(user.id, id);
  }

  @Delete('children/:childId/link')
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Remove accepted parent–child link' })
  unlinkChild(@Param('childId') childId: string, @GetUser() user: any) {
    return this.parentsService.unlinkChild(user.id, childId);
  }

  @Get('link-requests/outgoing')
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Link requests sent by parent, waiting for student acceptance' })
  @ApiResponse({ status: 200 })
  getOutgoingLinkRequests(@GetUser() user: any) {
    return this.parentsService.getOutgoingPending(user.id);
  }

  @Get('link-requests/incoming')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'Pending parent link requests for the logged-in student' })
  @ApiResponse({ status: 200 })
  getIncomingLinkRequests(@GetUser() user: any) {
    return this.parentsService.getPendingForStudent(user.id);
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

  @Get('children/:id/dashboard')
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Full dashboard snapshot for a linked child' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  getChildDashboard(@Param('id') childId: string, @GetUser() user: any) {
    return this.parentsService.getChildDashboard(user.id, childId);
  }
}
