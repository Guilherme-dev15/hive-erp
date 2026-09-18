import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

describe('CreateOrderDto catalog contract', () => {
  const validatePayload = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(CreateOrderDto, payload);
    return validate(dto);
  };

  it('accepts the versioned order shape', async () => {
    const errors = await validatePayload({
      customerName: 'Cliente teste',
      subtotal: 10,
      total: 10,
      items: [{ name: 'Produto', salePrice: 10, quantity: 1 }],
    });

    expect(errors).toHaveLength(0);
  });

  it('does not treat the legacy catalog payload as the versioned contract', async () => {
    const errors = await validatePayload({
      customerName: 'Cliente teste',
      subtotal: 10,
      total: 10,
      storeId: 'store-1',
      status: 'paid',
      items: [{ id: 'product-1', name: 'Produto', salePrice: 10, quantidade: 1 }],
    });

    const fields = errors.flatMap((error) => error.property);
    expect(fields).toEqual(expect.arrayContaining(['items', 'status']));
    expect(errors.find((error) => error.property === 'items')?.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: '0' })]),
    );
    expect(fields).not.toContain('storeId');
  });

  it('rejects non-whitelisted fields with the server validation configuration', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

    await expect(
      pipe.transform(
        {
          customerName: 'Cliente teste',
          subtotal: 10,
          total: 10,
          items: [{ name: 'Produto', salePrice: 10, quantity: 1 }],
          storeId: 'store-1',
        },
        { type: 'body', metatype: CreateOrderDto },
      ),
    ).rejects.toThrow();
  });
});
