import { Injectable } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApplyCampaignDto,
  CampaignSimulationResponse,
  SimulateCampaignDto,
} from './dto/campaign.dto';

export const CAMPAIGN_BACKUP_SKU = '__CAMPAIGN_BACKUP__';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async simulate(
    userId: string,
    dto: SimulateCampaignDto,
  ): Promise<CampaignSimulationResponse> {
    const discount = dto.discount ?? dto.discountPercent ?? 0;
    const minMarkup = dto.minMarkup ?? 1.0;

    const products = await this.prisma.product.findMany({
      where: {
        userId,
        status: ProductStatus.ATIVO,
      },
    });

    if (products.length === 0) {
      return {
        totalProducts: 0,
        affectedProducts: 0,
        skippedProducts: 0,
        currentRevenue: 0,
        projectedRevenue: 0,
        currentProfit: 0,
        projectedProfit: 0,
        currentAvgMarkup: 0,
        projectedAvgMarkup: 0,
        totalCost: 0,
      };
    }

    let affectedProducts = 0;
    let skippedProducts = 0;
    let currentRevenue = 0;
    let projectedRevenue = 0;
    let currentProfit = 0;
    let projectedProfit = 0;
    let totalCost = 0;
    let totalMarkupSumCurrent = 0;
    let totalMarkupSumProjected = 0;

    products.forEach((p) => {
      const cost = Number(p.costPrice || 0);
      const currentPrice = Number(p.salePrice || 0);
      const stock = Number(p.quantity || 0);

      const currentMargin = currentPrice - cost;
      const currentMarkup = cost > 0 ? currentPrice / cost : 0;

      totalCost += cost * stock;
      currentRevenue += currentPrice * stock;
      currentProfit += currentMargin * stock;
      totalMarkupSumCurrent += currentMarkup;

      let newPrice = currentPrice * (1 - discount / 100);
      const minSafePrice = cost * minMarkup;

      if (cost > 0 && newPrice < minSafePrice) {
        newPrice = minSafePrice;
        skippedProducts++;
      } else {
        affectedProducts++;
      }

      if (cost === 0) {
        newPrice = currentPrice * (1 - discount / 100);
      }

      const newMargin = newPrice - cost;
      const newMarkup = cost > 0 ? newPrice / cost : 0;

      projectedRevenue += newPrice * stock;
      projectedProfit += newMargin * stock;
      totalMarkupSumProjected += newMarkup;
    });

    const count = products.length;

    return {
      totalProducts: count,
      affectedProducts,
      skippedProducts,
      currentRevenue: Math.round(currentRevenue * 100) / 100,
      projectedRevenue: Math.round(projectedRevenue * 100) / 100,
      currentProfit: Math.round(currentProfit * 100) / 100,
      projectedProfit: Math.round(projectedProfit * 100) / 100,
      currentAvgMarkup: Math.round((totalMarkupSumCurrent / count) * 100) / 100,
      projectedAvgMarkup: Math.round((totalMarkupSumProjected / count) * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }

  async apply(
    userId: string,
    dto: ApplyCampaignDto,
  ): Promise<{ success: boolean; count: number; message: string }> {
    const discount = dto.discount ?? dto.discountPercent ?? 0;
    const minMarkup = dto.minMarkup ?? 1.0;
    const campaignName = dto.campaignName?.trim() || 'Oferta Especial';

    const products = await this.prisma.product.findMany({
      where: {
        userId,
        status: ProductStatus.ATIVO,
      },
    });

    if (products.length === 0) {
      return { success: true, count: 0, message: 'Nenhum produto ativo para aplicar campanha.' };
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Limpar backups antigos se houver
      await tx.productVariant.deleteMany({
        where: {
          skuSuffix: CAMPAIGN_BACKUP_SKU,
          product: { userId },
        },
      });

      // 2. Criar backups e aplicar novo preço
      for (const p of products) {
        const cost = Number(p.costPrice || 0);
        const currentPrice = Number(p.salePrice || 0);
        let newPrice = currentPrice * (1 - discount / 100);
        const minSafePrice = cost * minMarkup;

        if (cost > 0 && newPrice < minSafePrice) {
          newPrice = minSafePrice;
        }

        const finalPrice = Math.round(newPrice * 100) / 100;

        await tx.productVariant.create({
          data: {
            productId: p.id,
            skuSuffix: CAMPAIGN_BACKUP_SKU,
            adjustmentValue: currentPrice,
            measurement: campaignName,
            stock: 0,
            onDemand: false,
          },
        });

        await tx.product.update({
          where: { id: p.id },
          data: { salePrice: finalPrice },
        });
      }

      return {
        success: true,
        count: products.length,
        message: `${products.length} produtos atualizados com sucesso.`,
      };
    });
  }

  async revert(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const backups = await this.prisma.productVariant.findMany({
      where: {
        skuSuffix: CAMPAIGN_BACKUP_SKU,
        product: { userId },
      },
      select: {
        id: true,
        productId: true,
        adjustmentValue: true,
      },
    });

    if (backups.length === 0) {
      return { success: true, message: 'Nenhuma campanha ativa para reverter.' };
    }

    return this.prisma.$transaction(async (tx) => {
      for (const backup of backups) {
        await tx.product.update({
          where: { id: backup.productId },
          data: { salePrice: Number(backup.adjustmentValue) },
        });
      }

      await tx.productVariant.deleteMany({
        where: {
          id: { in: backups.map((b) => b.id) },
        },
      });

      return {
        success: true,
        message: `${backups.length} produtos voltaram ao preço original.`,
      };
    });
  }

  async getStatus(userId: string): Promise<{ active: boolean; count: number; campaignName: string | null }> {
    const backups = await this.prisma.productVariant.findMany({
      where: {
        skuSuffix: CAMPAIGN_BACKUP_SKU,
        product: { userId },
      },
      select: {
        measurement: true,
      },
      take: 1,
    });

    const count = await this.prisma.productVariant.count({
      where: {
        skuSuffix: CAMPAIGN_BACKUP_SKU,
        product: { userId },
      },
    });

    return {
      active: count > 0,
      count,
      campaignName: backups.length > 0 ? backups[0].measurement : null,
    };
  }
}
