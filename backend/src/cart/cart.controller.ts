import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, ApplyCouponDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get cart with total' })
  @ApiResponse({ status: 200, description: 'Cart retrieved' })
  getCart(@GetUser() user: any) {
    return this.cartService.getCart(user.id);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add course to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  addItem(@Body() dto: AddToCartDto, @GetUser() user: any) {
    return this.cartService.addItem(dto, user.id);
  }

  @Delete('item/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  removeItem(@Param('id') id: string, @GetUser() user: any) {
    return this.cartService.removeItem(id, user.id);
  }

  @Post('apply-coupon')
  @ApiOperation({ summary: 'Apply coupon to cart' })
  @ApiResponse({ status: 200, description: 'Coupon applied' })
  applyCoupon(@Body() dto: ApplyCouponDto, @GetUser() user: any) {
    return this.cartService.applyCoupon(dto, user.id);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  clearCart(@GetUser() user: any) {
    return this.cartService.clearCart(user.id);
  }
}
