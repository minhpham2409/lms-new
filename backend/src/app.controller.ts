import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root controller — only serves health-check and root info.
 * Auth routes are handled exclusively by AuthController.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
