import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { AuthGuard } from '../auth/auth.guard';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
  };

  const mockCustomer = {
    id: '11988887777',
    name: 'Maria Silva',
    phone: '11988887777',
    cleanPhone: '11988887777',
    totalOrders: 2,
    totalSpent: 400.0,
    averageTicket: 200.0,
    firstOrderDate: new Date(),
    lastOrderDate: new Date(),
    lastOrderStatus: 'CONCLUIDO',
    orders: [],
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('chama service.findAll passando o userId do request', async () => {
    service.findAll.mockResolvedValue({
      data: [mockCustomer],
      total: 1,
      totalRevenue: 400.0,
      averageTicketGlobal: 200.0,
    });

    const req = { user: { id: 'tenant-123' } };
    const query = { search: 'Maria' };

    const result = await controller.findAll(req, query);

    expect(service.findAll).toHaveBeenCalledWith('tenant-123', query);
    expect(result.total).toBe(1);
    expect(result.data[0].name).toBe('Maria Silva');
  });

  it('chama service.findOne passando o userId e o identificador do cliente', async () => {
    service.findOne.mockResolvedValue(mockCustomer);

    const req = { user: { id: 'tenant-123' } };
    const result = await controller.findOne('11988887777', req);

    expect(service.findOne).toHaveBeenCalledWith('tenant-123', '11988887777');
    expect(result.name).toBe('Maria Silva');
  });
});
