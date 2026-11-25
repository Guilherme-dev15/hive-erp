import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockPrisma: any;

  const mockUserId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    mockPrisma = {
      category: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list all categories for the tenant ordered by name', async () => {
    const mockCategories = [
      { id: 'cat-1', name: 'ANEIS', userId: mockUserId },
      { id: 'cat-2', name: 'CORRENTES', userId: mockUserId },
    ];
    mockPrisma.category.findMany.mockResolvedValue(mockCategories);

    const result = await service.findAll(mockUserId);

    expect(result).toEqual(mockCategories);
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      orderBy: { name: 'asc' },
    });
  });

  it('should create a new category for the tenant if not already existing', async () => {
    mockPrisma.category.findFirst.mockResolvedValue(null);
    const createdCategory = { id: 'cat-new', name: 'BRINCOS', userId: mockUserId };
    mockPrisma.category.create.mockResolvedValue(createdCategory);

    const result = await service.create(mockUserId, { name: 'BRINCOS' });

    expect(result).toEqual(createdCategory);
    expect(mockPrisma.category.create).toHaveBeenCalledWith({
      data: {
        name: 'BRINCOS',
        userId: mockUserId,
      },
    });
  });

  it('should return existing category if name already exists for tenant (idempotent)', async () => {
    const existingCategory = { id: 'cat-existing', name: 'BRINCOS', userId: mockUserId };
    mockPrisma.category.findFirst.mockResolvedValue(existingCategory);

    const result = await service.create(mockUserId, { name: 'brincos' });

    expect(result).toEqual(existingCategory);
    expect(mockPrisma.category.create).not.toHaveBeenCalled();
  });

  it('should delete category if found for tenant', async () => {
    const existing = { id: 'cat-1', name: 'PULSEIRAS', userId: mockUserId };
    mockPrisma.category.findFirst.mockResolvedValue(existing);
    mockPrisma.category.delete.mockResolvedValue(existing);

    const result = await service.remove(mockUserId, 'cat-1');

    expect(result).toEqual({ success: true, id: 'cat-1' });
    expect(mockPrisma.category.delete).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
    });
  });

  it('should throw NotFoundException when deleting category of another tenant or not found', async () => {
    mockPrisma.category.findFirst.mockResolvedValue(null);

    await expect(service.remove(mockUserId, 'cat-alien')).rejects.toThrow(
      new NotFoundException('Categoria não encontrada')
    );
    expect(mockPrisma.category.delete).not.toHaveBeenCalled();
  });
});
