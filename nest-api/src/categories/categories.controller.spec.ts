import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '../auth/auth.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategoriesService = {
    findAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SubscriptionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list all categories for the logged user', async () => {
    const mockList = [{ id: '1', name: 'ANEIS' }];
    mockCategoriesService.findAll.mockResolvedValue(mockList);

    const result = await controller.findAll({ user: { id: mockUserId } });

    expect(result).toEqual(mockList);
    expect(mockCategoriesService.findAll).toHaveBeenCalledWith(mockUserId);
  });

  it('should create a category', async () => {
    const mockCat = { id: '2', name: 'PULSEIRAS' };
    mockCategoriesService.create.mockResolvedValue(mockCat);

    const result = await controller.create(
      { user: { id: mockUserId } },
      { name: 'PULSEIRAS' }
    );

    expect(result).toEqual(mockCat);
    expect(mockCategoriesService.create).toHaveBeenCalledWith(mockUserId, { name: 'PULSEIRAS' });
  });

  it('should delete a category', async () => {
    mockCategoriesService.remove.mockResolvedValue({ success: true, id: 'cat-1' });

    const result = await controller.remove({ user: { id: mockUserId } }, 'cat-1');

    expect(result).toEqual({ success: true, id: 'cat-1' });
    expect(mockCategoriesService.remove).toHaveBeenCalledWith(mockUserId, 'cat-1');
  });
});
