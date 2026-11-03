import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { AuthGuard } from '../auth/auth.guard';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: SuppliersService;

  const mockSuppliersService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get<SuppliersService>(SuppliersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list all suppliers for the logged user', async () => {
    const mockList = [{ id: 'sup-1', name: 'Pratas SP' }];
    mockSuppliersService.findAll.mockResolvedValue(mockList);

    const result = await controller.findAll({ user: { id: mockUserId } });

    expect(result).toEqual(mockList);
    expect(mockSuppliersService.findAll).toHaveBeenCalledWith(mockUserId);
  });

  it('should create a supplier', async () => {
    const dto = { name: 'Pratas SP' };
    const mockSupplier = { id: 'sup-1', ...dto };
    mockSuppliersService.create.mockResolvedValue(mockSupplier);

    const result = await controller.create({ user: { id: mockUserId } }, dto);

    expect(result).toEqual(mockSupplier);
    expect(mockSuppliersService.create).toHaveBeenCalledWith(mockUserId, dto);
  });

  it('should update a supplier', async () => {
    const dto = { name: 'Pratas Brasil' };
    const mockSupplier = { id: 'sup-1', ...dto };
    mockSuppliersService.update.mockResolvedValue(mockSupplier);

    const result = await controller.update({ user: { id: mockUserId } }, 'sup-1', dto);

    expect(result).toEqual(mockSupplier);
    expect(mockSuppliersService.update).toHaveBeenCalledWith(mockUserId, 'sup-1', dto);
  });

  it('should delete a supplier', async () => {
    mockSuppliersService.remove.mockResolvedValue({ success: true, id: 'sup-1' });

    const result = await controller.remove({ user: { id: mockUserId } }, 'sup-1');

    expect(result).toEqual({ success: true, id: 'sup-1' });
    expect(mockSuppliersService.remove).toHaveBeenCalledWith(mockUserId, 'sup-1');
  });
});
