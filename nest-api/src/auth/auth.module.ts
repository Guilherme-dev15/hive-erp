import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { AuthGuard } from './auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { AuthController } from './auth.controller';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [AuthController],
  providers: [AuthGuard, SuperAdminGuard],
  exports: [AuthGuard, SuperAdminGuard],
})
export class AuthModule {}
