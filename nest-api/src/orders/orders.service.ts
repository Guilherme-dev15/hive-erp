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
              throw new BadRequestException(`Estoque insuficiente para o produto ${product.name}. Disponível: ${product.quantity}, Solicitado: ${item.quantity}`);
            }

            // Decrementa o estoque
            await tx.product.update({
              where: { id: product.id },
              data: { quantity: { decrement: item.quantity } },
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
      // Se era orçamento e foi aprovado/ativado (ex: AGUARDANDO_PAGAMENTO ou PAGO), baixa estoque agora
      if (order.status === OrderStatus.ORCAMENTO && newStatus !== OrderStatus.CANCELADO) {
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
              await tx.product.update({
                where: { id: product.id },
                data: { quantity: { decrement: item.quantity } },
              });
            }
          }
        }
      }

      // Se estiver cancelando (e NÃO era orçamento), restauramos o estoque
      if (newStatus === OrderStatus.CANCELADO && order.status !== OrderStatus.ORCAMENTO) {
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

  // Máquina de estados baseada no legacy (order.service.js)
  private getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      ORCAMENTO: [OrderStatus.AGUARDANDO_PAGAMENTO, OrderStatus.PAGO, OrderStatus.EM_SEPARACAO, OrderStatus.CANCELADO],
      AGUARDANDO_PAGAMENTO: [OrderStatus.PAGO, OrderStatus.EM_PRODUCAO, OrderStatus.EM_SEPARACAO, OrderStatus.CANCELADO],
      PAGO: [OrderStatus.EM_PRODUCAO, OrderStatus.CANCELADO],
      EM_PRODUCAO: [OrderStatus.EM_SEPARACAO, OrderStatus.CANCELADO],
      EM_SEPARACAO: [OrderStatus.ENVIADO, OrderStatus.CONCLUIDO, OrderStatus.CANCELADO],
      ENVIADO: [OrderStatus.CONCLUIDO, OrderStatus.CANCELADO], // As vezes pode cancelar/devolver após envio
      CONCLUIDO: [],
      CANCELADO: []
    };
    return transitions[currentStatus] || [];
  }
}
