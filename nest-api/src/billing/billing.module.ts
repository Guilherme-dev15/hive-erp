import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingCatalogService } from './billing-catalog.service';
import { SubscriptionService } from './subscription.service';
import { BillingService } from './billing.service';
import { SubscriptionGuard } from './subscription.guard';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { BillingWebhookGuard } from './billing-webhook.guard';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [
    BillingCatalogService,
    SubscriptionService,
    BillingService,
    SubscriptionGuard,
    BillingWebhookGuard,
  ],
  exports: [
    BillingCatalogService,
    SubscriptionService,
    BillingService,
    SubscriptionGuard,
    BillingWebhookGuard,
  ],
})
export class BillingModule {}
