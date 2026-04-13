import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created' })
  create(@Body() dto: CreateOrderDto, @GetUser() user: any) {
    return this.ordersService.create(dto, user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  findMyOrders(@GetUser() user: any) {
    return this.ordersService.findMyOrders(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiResponse({ status: 200, description: 'Order retrieved' })
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.ordersService.findOne(id, user.id);
  }
}
