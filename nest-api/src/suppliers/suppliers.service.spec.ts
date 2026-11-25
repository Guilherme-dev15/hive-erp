import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let mockPrisma: any;

  const mockUserId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    mockPrisma = {
      supplier: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list all suppliers for the tenant ordered by name', async () => {
    const mockList = [
      { id: 'sup-1', name: 'Pratas SP', userId: mockUserId },
      { id: 'sup-2', name: 'Joias Limeira', userId: mockUserId },
    ];
    mockPrisma.supplier.findMany.mockResolvedValue(mockList);

    const result = await service.findAll(mockUserId);

    expect(result).toEqual(mockList);
    expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      orderBy: { name: 'asc' },
    });
  });

  it('should create a new supplier for the tenant', async () => {
    const dto = {
      name: 'Pratas SP',
      contactPhone: '11999999999',
      email: 'contato@pratassp.com',
    };
    const created = { id: 'sup-new', ...dto, userId: mockUserId };
    mockPrisma.supplier.create.mockResolvedValue(created);

    const result = await service.create(mockUserId, dto);

    expect(result).toEqual(created);
    expect(mockPrisma.supplier.create).toHaveBeenCalledWith({
      data: {
        ...dto,
        userId: mockUserId,
      },
    });
  });

  it('should update an existing supplier belonging to the tenant', async () => {
    const existing = { id: 'sup-1', name: 'Pratas SP', userId: mockUserId };
    mockPrisma.supplier.findFirst.mockResolvedValue(existing);
    const updated = { ...existing, name: 'Pratas Brasil' };
    mockPrisma.supplier.update.mockResolvedValue(updated);

    const result = await service.update(mockUserId, 'sup-1', { name: 'Pratas Brasil' });

    expect(result).toEqual(updated);
    expect(mockPrisma.supplier.update).toHaveBeenCalledWith({
      where: { id: 'sup-1' },
      data: { name: 'Pratas Brasil' },
    });
  });

  it('should throw NotFoundException when updating supplier of another tenant', async () => {
    mockPrisma.supplier.findFirst.mockResolvedValue(null);

    await expect(service.update(mockUserId, 'sup-alien', { name: 'New' })).rejects.toThrow(
      new NotFoundException('Fornecedor não encontrado')
    );
    expect(mockPrisma.supplier.update).not.toHaveBeenCalled();
  });

  it('should delete a supplier if found for tenant', async () => {
    const existing = { id: 'sup-1', name: 'Pratas SP', userId: mockUserId };
    mockPrisma.supplier.findFirst.mockResolvedValue(existing);
    mockPrisma.supplier.delete.mockResolvedValue(existing);

    const result = await service.remove(mockUserId, 'sup-1');

    expect(result).toEqual({ success: true, id: 'sup-1' });
    expect(mockPrisma.supplier.delete).toHaveBeenCalledWith({
      where: { id: 'sup-1' },
    });
  });

  it('should throw NotFoundException when deleting supplier of another tenant', async () => {
    mockPrisma.supplier.findFirst.mockResolvedValue(null);

    await expect(service.remove(mockUserId, 'sup-alien')).rejects.toThrow(
      new NotFoundException('Fornecedor não encontrado')
    );
    expect(mockPrisma.supplier.delete).not.toHaveBeenCalled();
  });
});
