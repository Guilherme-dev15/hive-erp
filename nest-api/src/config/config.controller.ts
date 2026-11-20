import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from './config.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';

@UseGuards(AuthGuard, SubscriptionGuard)
@Controller('api/v2/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfig(@Request() req: any) {
    return this.configService.getConfig(req.user.id);
  }

  @Post()
  saveConfig(@Request() req: any, @Body() updateConfigDto: UpdateConfigDto) {
    return this.configService.saveConfig(req.user.id, updateConfigDto);
  }

  @Put()
  updateConfig(@Request() req: any, @Body() updateConfigDto: UpdateConfigDto) {
    return this.configService.saveConfig(req.user.id, updateConfigDto);
  }
}
