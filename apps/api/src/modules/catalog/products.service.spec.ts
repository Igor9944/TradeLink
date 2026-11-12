import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterProductDto } from './dto/filter-product.dto';
import { ProductsService } from './products.service';

describe('ProductsService manageable catalog', () => {
  it('keeps supplier scope even when a different supplier filter is requested', async () => {
    const prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = new ProductsService(prisma as unknown as PrismaService);

    await service.findManageable(
      { page: 1, limit: 10 },
      { supplierId: 'another-supplier' },
      'supplier-1',
      Role.SUPPLIER,
    );

    expect(prisma.product.findMany.mock.calls[0][0].where.supplierId).toBe(
      'supplier-1',
    );
  });

  it('parses false query filters as false rather than truthy strings', () => {
    const filters = plainToInstance(FilterProductDto, {
      isPublic: 'false',
      isActive: 'false',
    });

    expect(filters.isPublic).toBe(false);
    expect(filters.isActive).toBe(false);
  });

  it('accepts pagination and filters together as a products query', () => {
    const query = plainToInstance(FilterProductDto, {
      page: '1',
      limit: '12',
      categoryId: 'category-1',
    });

    expect(validateSync(query)).toEqual([]);
    expect(query.page).toBe(1);
    expect(query.limit).toBe(12);
  });
});
