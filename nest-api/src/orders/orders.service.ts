import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, TransactionType } from '@prisma/client';

export const STATUS_UI_TO_PRISMA: Record<string, OrderStatus> = {
  'Aguardando Pagamento': OrderStatus.AGUARDANDO_PAGAMENTO,
  'Pago': OrderStatus.PAGO,
  'Em Produção': OrderStatus.EM_PRODUCAO,
  'Em Separação': OrderStatus.EM_SEPARACAO,
  'Enviado': OrderStatus.ENVIADO,
  'Concluído': OrderStatus.CONCLUIDO,
  'Cancelado': OrderStatus.CANCELADO,
  // Also support direct string keys
  AGUARDANDO_PAGAMENTO: OrderStatus.AGUARDANDO_PAGAMENTO,
  PAGO: OrderStatus.PAGO,
  EM_PRODUCAO: OrderStatus.EM_PRODUCAO,
  EM_SEPARACAO: OrderStatus.EM_SEPARACAO,
  ENVIADO: OrderStatus.ENVIADO,
  CONCLUIDO: OrderStatus.CONCLUIDO,
  CANCELADO: OrderStatus.CANCELADO,
};

export const STATUS_PRISMA_TO_UI: Record<OrderStatus, string> = {
  [OrderStatus.AGUARDANDO_PAGAMENTO]: 'Aguardando Pagamento',
  [OrderStatus.PAGO]: 'Aguardando Pagamento',
  [OrderStatus.EM_PRODUCAO]: 'Em Produção',
  [OrderStatus.EM_SEPARACAO]: 'Em Separação',
  [OrderStatus.ENVIADO]: 'Enviado',
  [OrderStatus.CONCLUIDO]: 'Concluído',
  [OrderStatus.CANCELADO]: 'Cancelado',
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  normalizeStatus(status: string | OrderStatus): OrderStatus {
    const mapped = STATUS_UI_TO_PRISMA[status];
    if (mapped) return mapped;
    if (Object.values(OrderStatus).includes(status as OrderStatus)) {
      return status as OrderStatus;
    }
    throw new BadRequestException(`Status de pedido inválido: ${status}`);
  }

  formatOrderForUi(order: any) {
    if (!order) return order;
    return {
      ...order,
      status: STATUS_PRISMA_TO_UI[order.status as OrderStatus] || order.status,
      rawStatus: order.status,
    };
  }

  async findAll(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => this.formatOrderForUi(order));
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return order;
  }

  async create(data: CreateOrderDto, userId: string) {
    const isBudget = data.status === OrderStatus.ORCAMENTO;

    // 1. Iniciamos uma transação no Prisma para garantir atomicidade (Estoque + Pedido)
    return this.prisma.$transaction(async (tx) => {
      // 2. Se não for orçamento, verificar estoque e decrementar
      if (!isBudget) {
        for (const item of data.items) {
          if (item.productId) {
            const product = await tx.product.findFirst({
              where: { id: item.productId, userId },
            });

            if (!product) {
              throw new BadRequestException(`Produto ${item.name} não encontrado no catálogo.`);
            }

            if (product.quantity < item.quantity) {
              throw new BadRequestException(
                `Estoque insuficiente para o produto ${product.name}. Disponível: ${product.quantity}, Solicitado: ${item.quantity}`,
              );
            }

            // Decrementa o estoque
            const updatedProduct = await tx.product.update({
              where: { id: product.id },
              data: { quantity: { decrement: item.quantity } },
            });

            await tx.inventoryLog.create({
              data: {
                productId: product.id,
                userId,
                type: 'VENDA_MANUAL',
                change: item.quantity,
                newQuantity: updatedProduct?.quantity ?? 0,
                userName: 'Sistema',
              },
            });
          }
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
              status: data.status ? this.normalizeStatus(data.status) : OrderStatus.AGUARDANDO_PAGAMENTO,
              subtotal: data.subtotal,
              discount: data.discount,
              total: data.total,
              notes: data.notes,
              financialRegistered: data.financialRegistered,
            },
          });
        }
      }

      const { items, ...orderData } = data;
      const createdOrder = await tx.order.create({
        data: {
          ...orderData,
          status: data.status ? this.normalizeStatus(data.status) : OrderStatus.AGUARDANDO_PAGAMENTO,
          userId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              name: item.name,
              code: item.code,
              salePrice: item.salePrice,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
            })),
          },
        },
        include: { items: true },
      });

      return this.formatOrderForUi(createdOrder);
    });
  }

  async updateStatus(id: string, statusInput: string | OrderStatus, userId: string) {
    const order = await this.findOne(id, userId);
    const newStatus = this.normalizeStatus(statusInput);

    // Se já estiver no status solicitado, retorno idempotente sem erro
    if (newStatus === order.status) {
      return this.formatOrderForUi(order);
    }

    return this.prisma.$transaction(async (tx) => {
      if (order.status === OrderStatus.ORCAMENTO && newStatus !== OrderStatus.CANCELADO && newStatus !== OrderStatus.ORCAMENTO) {
        for (const item of order.items) {
          if (item.productId) {
            const product = await tx.product.findFirst({
              where: { id: item.productId, userId },
            });
            if (product && product.quantity < item.quantity) {
              throw new BadRequestException(
                `Estoque insuficiente ao aprovar orçamento para ${product.name}. Disponível: ${product.quantity}, Solicitado: ${item.quantity}`,
              );
            }
            if (product) {
              const updatedProduct = await tx.product.update({
                where: { id: product.id },
                data: { quantity: { decrement: item.quantity } },
              });
              await tx.inventoryLog.create({
                data: {
                  productId: product.id,
                  userId,
                  type: 'VENDA_MANUAL',
                  change: item.quantity,
                  newQuantity: updatedProduct?.quantity ?? 0,
                  userName: 'Sistema',
                },
              });
            }
          }
        }
      }

      // 1. Se estiver cancelando (e antes não estava cancelado e não era orçamento), restaurar estoque e registrar log
      if (newStatus === OrderStatus.CANCELADO && order.status !== OrderStatus.CANCELADO && order.status !== OrderStatus.ORCAMENTO) {
        for (const item of order.items) {
          if (item.productId) {
            const restoredProduct = await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: item.quantity } },
            });
            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                userId,
                type: 'CANCELAMENTO_PEDIDO',
                change: item.quantity,
                newQuantity: restoredProduct?.quantity ?? 0,
                userName: 'Sistema',
              },
            });
          }
        }
      }

      // 1b. Se estava cancelado e está reativando para outro status ativo, decrementar estoque novamente
      if (order.status === OrderStatus.CANCELADO && newStatus !== OrderStatus.CANCELADO) {
        for (const item of order.items) {
          if (item.productId) {
            const updatedProduct = await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } },
            });
            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                userId,
                type: 'REABERTURA_PEDIDO',
                change: -item.quantity,
                newQuantity: updatedProduct?.quantity ?? 0,
                userName: 'Sistema',
              },
            });
          }
        }
      }

      // 2. Se estiver concluindo ou pago, registrar transação no Financeiro se ainda não registrada
      let financialRegistered = order.financialRegistered;
      if (newStatus === OrderStatus.CONCLUIDO || newStatus === OrderStatus.PAGO) {
        if (!order.financialRegistered) {
          await tx.transaction.create({
            data: {
              userId,
              type: TransactionType.VENDA,
              amount: order.total,
              description: `Venda Pedido #${order.id.slice(0, 8).toUpperCase()} - ${order.customerName}`,
              date: new Date(),
              orderId: order.id,
            },
          });
          financialRegistered = true;
        }
      }

      // Atualiza o pedido
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          financialRegistered,
        },
        include: { items: true },
      });

      return this.formatOrderForUi(updatedOrder);
    });
  }

  getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
    // Para lojistas no ERP, todas as transições entre estados válidos são permitidas,
    // garantindo flexibilidade operacional e correção de erros manuais.
    return Object.values(OrderStatus);
  }

  async remove(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.prisma.order.delete({
      where: { id },
    });

    return { success: true, id };
  }

  async emitNfe(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, customer: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status === OrderStatus.ORCAMENTO) {
      throw new BadRequestException('Não é possível emitir NF-e para um orçamento não aprovado.');
    }

    if (order.nfeStatus === 'EMITIDA' && order.nfeKey) {
      return order;
    }

    // Obter dados fiscais do emitente
    const config = await this.prisma.config.findUnique({ where: { userId } });
    const nfeSerie = config?.nfeSerie || 1;
    const currentNumber = config?.nfeProximoNumero || 1;
    const cnpj = (config?.cnpjEmitente || '00000000000191').replace(/\D/g, '').padEnd(14, '0').slice(0, 14);

    // Gerador de Chave de Acesso SEFAZ (44 dígitos padrão nacional)
    // Formato: cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + serie(3) + nNF(9) + tpEmis(1) + cNF(8) + cDV(1)
    const now = new Date();
    const uf = '35'; // SP padrão
    const aamm = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const mod = '55'; // NF-e modelo 55
    const serieStr = String(nfeSerie).padStart(3, '0');
    const nNFStr = String(currentNumber).padStart(9, '0');
    const tpEmis = '1'; // Normal
    const cNF = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Cálculo do dígito verificador módulo 11
    const baseKey = `${uf}${aamm}${cnpj}${mod}${serieStr}${nNFStr}${tpEmis}${cNF}`;
    let soma = 0;
    let peso = 2;
    for (let i = baseKey.length - 1; i >= 0; i--) {
      soma += parseInt(baseKey[i], 10) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    const cDV = resto < 2 ? 0 : 11 - resto;
    const nfeKey = `${baseKey}${cDV}`;
    const nfeProtocol = `1${uf}${aamm.slice(0, 2)}${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    // Atualiza próximo número no config
    if (config) {
      await this.prisma.config.update({
        where: { id: config.id },
        data: { nfeProximoNumero: currentNumber + 1 },
      });
    }

    // Salva no pedido
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        nfeKey,
        nfeNumber: currentNumber,
        nfeStatus: 'EMITIDA',
        nfeProtocol,
        nfeIssuedAt: now,
      },
      include: { items: true, customer: true },
    });
  }
  }
}
