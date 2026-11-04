import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { AuthGuard } from '../auth/auth.guard';

describe('CampaignsController', () => {
  let controller: CampaignsController;
  let service: {
    simulate: jest.Mock;
    apply: jest.Mock;
    revert: jest.Mock;
    getStatus: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      simulate: jest.fn(),
      apply: jest.fn(),
      revert: jest.fn(),
      getStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignsController],
      providers: [{ provide: CampaignsService, useValue: service }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CampaignsController>(CampaignsController);
  });

  it('delegates simulate to service with user id', async () => {
    const dto = { discount: 15, minMarkup: 1.2 };
    service.simulate.mockResolvedValue({ totalProducts: 10 });

    const res = await controller.simulate({ user: { id: 'u1' } }, dto);

    expect(res).toEqual({ totalProducts: 10 });
    expect(service.simulate).toHaveBeenCalledWith('u1', dto);
  });

  it('delegates apply to service with user id', async () => {
    const dto = { discount: 15, minMarkup: 1.2, campaignName: 'Promo' };
    service.apply.mockResolvedValue({ success: true, count: 5 });

    const res = await controller.apply({ user: { id: 'u1' } }, dto);

    expect(res).toEqual({ success: true, count: 5 });
    expect(service.apply).toHaveBeenCalledWith('u1', dto);
  });

  it('delegates revert to service with user id', async () => {
    service.revert.mockResolvedValue({ success: true, message: 'Revertido' });

    const res = await controller.revert({ user: { id: 'u1' } });

    expect(res).toEqual({ success: true, message: 'Revertido' });
    expect(service.revert).toHaveBeenCalledWith('u1');
  });

  it('delegates getStatus to service with user id', async () => {
    service.getStatus.mockResolvedValue({ active: true, count: 5, campaignName: 'Promo' });

    const res = await controller.getStatus({ user: { id: 'u1' } });

    expect(res).toEqual({ active: true, count: 5, campaignName: 'Promo' });
    expect(service.getStatus).toHaveBeenCalledWith('u1');
  });
});
