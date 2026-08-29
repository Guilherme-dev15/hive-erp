import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { TransactionsModule } from './transactions/transactions.module';
import { InventoryModule } from './inventory/inventory.module';
import { TeamModule } from './team/team.module';
import { AuthModule } from './auth/auth.module';
import { CouponsModule } from './coupons/coupons.module';
import { ConfigModule } from './config/config.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, ProductsModule, OrdersModule, TransactionsModule, InventoryModule, TeamModule, AuthModule, CouponsModule, ConfigModule, DashboardModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
