import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return order;
  }

  async create(data: CreateOrderDto, userId: string) {
    // 1. Iniciamos uma transação no Prisma para garantir atomicidade (Estoque + Pedido)
    return this.prisma.$transaction(async (tx) => {
      // 2. Verificar estoque e calcular total
      for (const item of data.items) {
        if (item.productId) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, userId },
          });

          if (!product) {
            throw new BadRequestException(`Produto ${item.name} não encontrado no catálogo.`);
          }

          if (product.quantity < item.quantity) {
            throw new BadRequestException(`Estoque insuficiente para o produto ${product.name}. Disponível: ${product.quantity}, Solicitado: ${item.quantity}`);
          }

          // Decrementa o estoque
          await tx.product.update({
            where: { id: product.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      // 3. Criar a ordem e os itens vinculados
      // Para o Dual Write
      if (data.legacyId) {
        // Upsert order
        const existingOrder = await tx.order.findUnique({ where: { legacyId: data.legacyId } });
        if (existingOrder) {
           return tx.order.update({
             where: { id: existingOrder.id },
             data: {
               customerName: data.customerName,
               customerPhone: data.customerPhone,
               status: data.status || 'AGUARDANDO_PAGAMENTO',
               subtotal: data.subtotal,
               discount: data.discount,
               total: data.total,
               notes: data.notes,
               financialRegistered: data.financialRegistered,
             }
           });
        }
      }

      return tx.order.create({
        data: {
          ...data,
          userId,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              name: item.name,
              code: item.code,
              salePrice: item.salePrice,
              quantity: item.quantity,
              imageUrl: item.imageUrl
            }))
          }
        },
        include: { items: true }
      });
    });
  }

  async updateStatus(id: string, newStatus: OrderStatus, userId: string) {
    const order = await this.findOne(id, userId);

    // Validação de transição (Máquina de Estado portável do Express)
    const validTransitions = this.getValidTransitions(order.status);
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(`Transição de status inválida: ${order.status} -> ${newStatus}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Se estiver cancelando, precisamos restaurar o estoque
      if (newStatus === OrderStatus.CANCELADO) {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: item.quantity } }
            });
          }
        }
      }

      // Atualiza o pedido
      return tx.order.update({
        where: { id },
        data: { status: newStatus }
      });
    });
  }

  // Máquina de estados baseada no legacy (order.service.js)
  private getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      AGUARDANDO_PAGAMENTO: [OrderStatus.EM_PRODUCAO, OrderStatus.EM_SEPARACAO, OrderStatus.CANCELADO],
      EM_PRODUCAO: [OrderStatus.EM_SEPARACAO, OrderStatus.CANCELADO],
      EM_SEPARACAO: [OrderStatus.ENVIADO, OrderStatus.CONCLUIDO, OrderStatus.CANCELADO],
      ENVIADO: [OrderStatus.CONCLUIDO, OrderStatus.CANCELADO], // As vezes pode cancelar/devolver após envio
      CONCLUIDO: [],
      CANCELADO: []
    };
    return transitions[currentStatus] || [];
  }
}
