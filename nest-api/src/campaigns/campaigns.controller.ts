import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CampaignsService } from './campaigns.service';
import { ApplyCampaignDto, SimulateCampaignDto } from './dto/campaign.dto';

@Controller('api/v2/campaign')
@UseGuards(AuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post('simulate')
  simulate(@Request() req: any, @Body() dto: SimulateCampaignDto) {
    return this.campaignsService.simulate(req.user.id, dto);
  }

  @Post('apply')
  apply(@Request() req: any, @Body() dto: ApplyCampaignDto) {
    return this.campaignsService.apply(req.user.id, dto);
  }

  @Post('revert')
  revert(@Request() req: any) {
    return this.campaignsService.revert(req.user.id);
  }

  @Get('status')
  getStatus(@Request() req: any) {
    return this.campaignsService.getStatus(req.user.id);
  }
}
