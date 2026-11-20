import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingCatalogService } from './billing-catalog.service';
import { SubscriptionService } from './subscription.service';
import { BillingService } from './billing.service';
import { SubscriptionGuard } from './subscription.guard';
import { BillingController } from './billing.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [BillingController],
  providers: [
    BillingCatalogService,
    SubscriptionService,
    BillingService,
    SubscriptionGuard,
  ],
  exports: [
    BillingCatalogService,
    SubscriptionService,
    BillingService,
    SubscriptionGuard,
  ],
})
export class BillingModule {}
