import { Test, TestingModule } from '@nestjs/testing';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionGuard } from '../billing/subscription.guard';

describe('CouponsController', () => {
  let controller: CouponsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponsController],
      providers: [
        {
          provide: CouponsService,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(SubscriptionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CouponsController>(CouponsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
