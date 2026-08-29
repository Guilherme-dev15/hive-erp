import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Agregação 1: Total de Pedidos e Receita Total
    const totalAgg = await this.prisma.order.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { total: true },
    });

    // Agregação 2: Pedidos Hoje
    const todayAgg = await this.prisma.order.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfToday },
      },
      _count: { id: true },
    });

    const totalOrders = totalAgg._count.id || 0;
    const totalRevenue = Number(totalAgg._sum.total || 0);
    const ordersToday = todayAgg._count.id || 0;

    return {
      stats: {
        totalVendas: totalRevenue,
        lucroLiquido: totalRevenue * 0.4, // Simulação temporária (igual ao legado)
        totalDespesas: totalRevenue * 0.6, // Simulação temporária
        saldoTotal: totalRevenue,
        activeProducts: 0, // Placeholder
      },
      charts: {
        salesByDay: [],
        incomeVsExpense: [],
      },
      // Compatibilidade retroativa
      totalOrders,
      ordersToday,
      averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }
}
