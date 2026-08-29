import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('api/v2')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard/stats')
  getStats(@Request() req: any) {
    return this.dashboardService.getStats(req.user.id);
  }
  
  @Get('dashboard-charts')
  getCharts(@Request() req: any) {
    return {
      salesByDay: [],
      incomeVsExpense: [],
    };
  }
  
  @Get('reports/abc')
  getABC(@Request() req: any) {
    return {
      items: [],
      summary: { totalRevenue: 0 }
    };
  }
}
