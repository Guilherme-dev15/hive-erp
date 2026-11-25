import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, TransactionType } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Agregação 1: Total de Pedidos e Receita Total (Apenas concluídos)
    const totalAgg = await this.prisma.order.aggregate({
      where: { userId, status: OrderStatus.CONCLUIDO },
      _count: { id: true },
      _sum: { total: true },
    });

    // Agregação 2: Pedidos e Vendas Hoje
    const todaySalesAgg = await this.prisma.order.aggregate({
      where: {
        userId,
        status: { in: [OrderStatus.CONCLUIDO, OrderStatus.PAGO, OrderStatus.ENVIADO, OrderStatus.EM_SEPARACAO] },
        createdAt: { gte: startOfToday },
      },
      _count: { id: true },
      _sum: { total: true },
    });

    const vendasHoje = Number(todaySalesAgg?._sum?.total || 0);
    const ordersToday = todaySalesAgg?._count?.id || 0;

    // KPI 2: Notas Emitidas / Concluídas
    const notasEmitidas =
      typeof this.prisma.order?.count === 'function'
        ? await this.prisma.order.count({
            where: {
              userId,
              OR: [
                { nfeStatus: 'EMITIDA' },
                { status: { in: [OrderStatus.CONCLUIDO, OrderStatus.ENVIADO] } },
              ],
            },
          })
        : 0;

    // KPI 3: Contas a Receber (transações a receber pendentes + pedidos aguardando pagamento)
    const pendingReceivablesAgg = typeof this.prisma.transaction?.aggregate === 'function'
      ? await this.prisma.transaction.aggregate({
          where: {
            userId,
            type: { in: [TransactionType.VENDA, TransactionType.CAPITAL] },
            status: 'PENDENTE',
          },
          _sum: { amount: true },
        })
      : null;
    const pendingOrdersAgg = typeof this.prisma.order?.aggregate === 'function'
      ? await this.prisma.order.aggregate({
          where: {
            userId,
            status: OrderStatus.AGUARDANDO_PAGAMENTO,
          },
          _sum: { total: true },
        })
      : null;
    const aReceber =
      Number(pendingReceivablesAgg?._sum?.amount || 0) +
      Number(pendingOrdersAgg?._sum?.total || 0);

    // KPI 4: Itens em Falta (Estoque zerado)
    const itensEmFalta =
      typeof this.prisma.product?.count === 'function'
        ? await this.prisma.product.count({
            where: {
              userId,
              status: 'ATIVO',
              quantity: { lte: 0 },
            },
          })
        : 0;

    // KPI 5: Contas a Pagar (despesas pendentes)
    const pendingPayablesAgg = typeof this.prisma.transaction?.aggregate === 'function'
      ? await this.prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.DESPESA,
            status: 'PENDENTE',
          },
          _sum: { amount: true },
        })
      : null;
    const aPagar = Number(pendingPayablesAgg?._sum?.amount || 0);

    // KPI 6: Lucro do Mês
    const monthSalesAgg = typeof this.prisma.order?.aggregate === 'function'
      ? await this.prisma.order.aggregate({
          where: {
            userId,
            status: { notIn: [OrderStatus.CANCELADO, OrderStatus.ORCAMENTO] },
            createdAt: { gte: startOfMonth },
          },
          _sum: { total: true },
        })
      : null;
    const monthSales = Number(monthSalesAgg?._sum?.total || 0);

    const monthExpensesAgg = typeof this.prisma.transaction?.aggregate === 'function'
      ? await this.prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.DESPESA,
            date: { gte: startOfMonth },
          },
          _sum: { amount: true },
        })
      : null;
    const monthExpenses = Number(monthExpensesAgg?._sum?.amount || 0);
    const lucroMesValor = monthSales - monthExpenses;
    const lucroMesPercent = monthSales > 0 ? ((lucroMesValor / monthSales) * 100).toFixed(1) : '0';

    // Contagem de produtos ativos
    const activeProducts = await this.prisma.product.count({
      where: { userId, status: 'ATIVO' },
    });

    // Agregação de Transações para Lucro/Despesa Real
    const transactionsAgg = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    });

    let totalDespesas = 0;
    let totalCapital = 0;

    transactionsAgg.forEach((t) => {
      if (t.type === TransactionType.DESPESA) totalDespesas += Number(t._sum.amount || 0);
      if (t.type === TransactionType.CAPITAL) totalCapital += Number(t._sum.amount || 0);
    });

    const totalOrders = totalAgg._count.id || 0;
    const totalRevenue = Number(totalAgg._sum.total || 0);
    const lucroLiquido = totalRevenue - totalDespesas;
    const saldoTotal = totalRevenue + totalCapital - totalDespesas;

    return {
      stats: {
        totalVendas: totalRevenue,
        lucroLiquido: lucroLiquido,
        totalDespesas: totalDespesas,
        saldoTotal: saldoTotal,
        activeProducts,
        // Os 6 KPIs da Colmeia Hive
        vendasHoje,
        notasEmitidas,
        aReceber,
        itensEmFalta,
        lucroMes: lucroMesValor,
        lucroMesPercent: Number(lucroMesPercent),
        aPagar,
      },
      // Compatibilidade retroativa
      totalOrders,
      ordersToday,
      averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }

  async getCharts(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Vendas nos últimos 30 dias agrupadas por data
    const recentOrders = await this.prisma.order.findMany({
      where: { 
        userId, 
        createdAt: { gte: thirtyDaysAgo },
        status: OrderStatus.CONCLUIDO
      },
      select: { createdAt: true, total: true }
    });

    const salesMap = new Map<string, number>();
    recentOrders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      const current = salesMap.get(dateStr) || 0;
      salesMap.set(dateStr, current + Number(order.total));
    });

    const salesByDay = Array.from(salesMap.entries())
      .map(([date, total]) => ({ name: date, vendas: total }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Despesas vs Receitas Gerais
    const transactionsAgg = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true }
    });

    let income = 0;
    let expense = 0;

    transactionsAgg.forEach(t => {
      if (t.type === TransactionType.VENDA || t.type === TransactionType.CAPITAL) income += Number(t._sum.amount || 0);
      if (t.type === TransactionType.DESPESA) expense += Number(t._sum.amount || 0);
    });

    const incomeVsExpense = [
      { name: 'Receitas', value: income },
      { name: 'Despesas', value: expense }
    ];

    return { salesByDay, incomeVsExpense };
  }

  async getABCReport(userId: string) {
    // 1. Busca todos os produtos ativos do inquilino
    const products = await this.prisma.product.findMany({
      where: { userId, status: 'ATIVO' },
      select: {
        id: true,
        name: true,
        quantity: true,
        salePrice: true,
        costPrice: true,
      }
    });

    let totalEstoqueValor = 0;
    let totalEstoqueCusto = 0;

    // 2. Calcula o valor em estoque de cada produto e o total global
    const mappedProducts = products.map(p => {
      const valorEstoque = Number(p.salePrice) * p.quantity;
      const custoEstoque = Number(p.costPrice || 0) * p.quantity;
      totalEstoqueValor += valorEstoque;
      totalEstoqueCusto += custoEstoque;
      return {
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        salePrice: Number(p.salePrice),
        costPrice: Number(p.costPrice || 0),
        valorEstoque,
        custoEstoque,
        lucroProjetado: valorEstoque - custoEstoque
      };
    });

    // 3. Ordena os produtos do maior para o menor valor em estoque
    mappedProducts.sort((a, b) => b.valorEstoque - a.valorEstoque);

    // 4. Aplica a Regra ABC (Pareto Simples Baseado em Valor Acumulado)
    let acumulado = 0;
    const curvaABC = mappedProducts.map(p => {
      acumulado += p.valorEstoque;
      const percentualAcumulado = totalEstoqueValor > 0 ? (acumulado / totalEstoqueValor) * 100 : 0;

      let classificacao: 'A' | 'B' | 'C' = 'C';
      if (percentualAcumulado <= 80) classificacao = 'A'; // Primeiros 80% do valor = Classe A
      else if (percentualAcumulado <= 95) classificacao = 'B'; // Próximos 15% = Classe B
      // Últimos 5% = Classe C

      return {
        ...p,
        classificacao
      };
    });

    // Calcula ticket médio a partir da receita total
    const totalAgg = await this.prisma.order.aggregate({
      where: { userId, status: OrderStatus.CONCLUIDO },
      _count: { id: true },
      _sum: { total: true },
    });

    const totalOrders = totalAgg._count.id || 0;
    const totalRevenueHistory = Number(totalAgg._sum.total || 0);
    const averageTicket = totalOrders > 0 ? totalRevenueHistory / totalOrders : 0;

    return {
      curvaABC,
      summary: {
        totalRevenue: totalEstoqueValor, // Valor total do estoque projetado (venda)
        totalCost: totalEstoqueCusto,    // Custo total do estoque
        projectedProfit: totalEstoqueValor - totalEstoqueCusto, // Lucro projetado
        averageTicket, // Ticket médio histórico
      },
      resumoEstoque: {
        totalItens: mappedProducts.length,
        valorTotal: totalEstoqueValor,
        produtosZerados: mappedProducts.filter(p => p.quantity <= 0).length
      }
    };
  }
}
