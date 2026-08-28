import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(productId: string, userId: string) {
    return this.prisma.inventoryLog.findMany({
      where: { productId, userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  async adjustInventory(productId: string, data: AdjustInventoryDto, userId: string) {
    // 1. Validar propriedade do produto
    const product = await this.prisma.product.findFirst({
      where: { id: productId, userId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Validação de segurança opcional: não permitir saída maior que o estoque (Express antigo permitia negativo?)
    // Vamos bloquear para evitar furos (assumindo boas práticas).
    if (data.type === 'exit' && product.quantity < data.quantity) {
       throw new BadRequestException(`Estoque insuficiente. Disponível: ${product.quantity}`);
    }

    // 2. Transação Atômica garantida pelo banco (ACID)
    return this.prisma.$transaction(async (tx) => {
      // 2.1 Incrementa ou decrementa
      // O Prisma suporta { increment } e { decrement } garantindo a matemática direta no BD
      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          quantity: data.type === 'entry' ? { increment: data.quantity } : { decrement: data.quantity }
        }
      });

      // 2.2 Cria o log
      await tx.inventoryLog.create({
        data: {
          userId,
          productId: product.id,
          type: data.type,
          change: data.quantity,
          newQuantity: updatedProduct.quantity,
          userName: data.userName
        }
      });

      return { success: true, newQuantity: updatedProduct.quantity };
    });
  }
}
