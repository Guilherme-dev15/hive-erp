import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';

@UseGuards(AuthGuard, SubscriptionGuard)
@Controller('api/v2')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard/stats')
  getStats(@Request() req: any) {
    return this.dashboardService.getStats(req.user.id);
  }
  
  @Get('dashboard-charts')
  getCharts(@Request() req: any) {
    return this.dashboardService.getCharts(req.user.id);
  }
  
  @Get('reports/abc')
  getABC(@Request() req: any) {
    return this.dashboardService.getABCReport(req.user.id);
  }
}
