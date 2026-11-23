import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionGuard } from '../billing/subscription.guard';

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const mockOrdersService = {};
    const mockPrismaService = {};
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: PrismaService, useValue: mockPrismaService }
      ]
    })
      .overrideGuard(SubscriptionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
