import { Module } from '@nestjs/common';
import { PublicCatalogController } from './public-catalog.controller';
import { PublicCatalogService } from './public-catalog.service';
import { PaymentsModule } from '../payments/payments.module';
import { PublicRateLimitGuard } from '../common/public-rate-limit.guard';

@Module({
  imports: [PaymentsModule],
  controllers: [PublicCatalogController],
  providers: [PublicCatalogService, PublicRateLimitGuard],
})
export class PublicCatalogModule {}
