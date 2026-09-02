import { AppController } from "./app.controller";
import { AppService } from "./app.service";
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
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: false, // Desliga logs de requisicoes default que dao muita poluição visual, podemos ligar dps
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
      },
    }),
    PrismaModule, 
    ProductsModule, 
    OrdersModule, 
    TransactionsModule, 
    InventoryModule, 
    TeamModule, 
    AuthModule, 
    CouponsModule, 
    ConfigModule, 
    DashboardModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
