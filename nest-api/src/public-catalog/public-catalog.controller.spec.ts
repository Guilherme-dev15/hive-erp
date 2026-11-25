import { Test, TestingModule } from '@nestjs/testing';
import { PublicCatalogController } from './public-catalog.controller';
import { PublicCatalogService } from './public-catalog.service';

describe('PublicCatalogController', () => {
  let controller: PublicCatalogController;
  let service: {
    getCatalog: jest.Mock;
    createOrder: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getCatalog: jest.fn(),
      createOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicCatalogController],
      providers: [{ provide: PublicCatalogService, useValue: service }],
    }).compile();

    controller = module.get<PublicCatalogController>(PublicCatalogController);
  });

  it('delegates getCatalog to service', async () => {
    const expected = { version: 'v1', data: {} } as any;
    service.getCatalog.mockResolvedValue(expected);

    await expect(controller.getCatalog({ slug: 'hive' })).resolves.toBe(expected);
    expect(service.getCatalog).toHaveBeenCalledWith({ slug: 'hive' });
  });

  it('delegates createOrder to service', async () => {
    const dto = {
      slug: 'hive',
      customerName: 'Cliente',
      customerPhone: '11999998888',
      subtotal: 50,
      total: 50,
      items: [{ name: 'Item', salePrice: 50, quantity: 1 }],
    };
    const expected = { success: true, orderId: 'ord-1' } as any;
    service.createOrder.mockResolvedValue(expected);

    await expect(controller.createOrder(dto as any)).resolves.toBe(expected);
    expect(service.createOrder).toHaveBeenCalledWith(dto);
  });
});
