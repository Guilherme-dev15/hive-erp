import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { SuperAdminService } from './super-admin.service';
import { UpdateTenantSubscriptionDto } from './dto/update-tenant-subscription.dto';
import { UpdateSetupRequestDto } from './dto/update-setup-request.dto';
import { SuperAdminImportProductsDto } from './dto/super-admin-import-products.dto';

@Controller('api/v2/super-admin')
@UseGuards(AuthGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('overview')
  getOverview() {
    return this.superAdminService.getOverview();
  }

  @Get('tenants')
  listTenants(@Query('search') search?: string, @Query('status') status?: string) {
    return this.superAdminService.listTenants({ search, status });
  }

  @Patch('tenants/:userId/subscription')
  updateTenantSubscription(
    @Param('userId') userId: string,
    @Body() dto: UpdateTenantSubscriptionDto,
    @Request() req: any,
  ) {
    return this.superAdminService.updateTenantSubscription(userId, dto, req.user.id);
  }

  @Get('setup-requests')
  listSetupRequests(@Query('status') status?: string, @Query('search') search?: string) {
    return this.superAdminService.listSetupRequests({ status, search });
  }

  @Patch('setup-requests/:id')
  updateSetupRequest(
    @Param('id') id: string,
    @Body() dto: UpdateSetupRequestDto,
    @Request() req: any,
  ) {
    return this.superAdminService.updateSetupRequest(id, dto, req.user.id);
  }

  @Post('tenants/:userId/import-products')
  importProductsForTenant(
    @Param('userId') userId: string,
    @Body() dto: SuperAdminImportProductsDto,
    @Request() req: any,
  ) {
    return this.superAdminService.importProductsForTenant(userId, dto, req.user.id);
  }
}
