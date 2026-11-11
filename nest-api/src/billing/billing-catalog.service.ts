import { Injectable } from '@nestjs/common';
import { SetupBatchTier } from '@prisma/client';
import { BillingCatalogSummary, SetupBatchOption } from './billing.types';

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeOptionalString(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function formatPriceBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

@Injectable()
export class BillingCatalogService {
  getTrialDays(): number {
    return parsePositiveInt(process.env.SAAS_TRIAL_DAYS, 14);
  }

  getMonthlyPlanCode(): string {
    return 'PRO_MONTHLY';
  }

  getMonthlyPlanName(): string {
    return normalizeOptionalString(process.env.SAAS_MONTHLY_PLAN_NAME) || 'Plano Mensal HiveERP';
  }

  getMonthlyPriceCents(): number {
    return parsePositiveInt(process.env.SAAS_MONTHLY_PRICE_CENTS, 9700);
  }

  getSetupBatches(): SetupBatchOption[] {
    return [
      {
        tier: SetupBatchTier.UP_TO_200,
        label: 'Setup Lote até 200 produtos',
        description: 'Nossa equipe cadastra e organiza até 200 produtos da sua planilha ou catálogo no painel.',
        maxProducts: 200,
        priceCents: parsePositiveInt(process.env.SAAS_SETUP_BATCH_200_PRICE_CENTS, 14900),
      },
      {
        tier: SetupBatchTier.UP_TO_300,
        label: 'Setup Lote até 300 produtos',
        description: 'Subida assistida de até 300 produtos com categorias e preços prontos para vender.',
        maxProducts: 300,
        priceCents: parsePositiveInt(process.env.SAAS_SETUP_BATCH_300_PRICE_CENTS, 19900),
      },
      {
        tier: SetupBatchTier.UP_TO_500,
        label: 'Setup Lote até 500 produtos',
        description: 'Implantação completa de catálogo de alto volume com até 500 produtos cadastrados.',
        maxProducts: 500,
        priceCents: parsePositiveInt(process.env.SAAS_SETUP_BATCH_500_PRICE_CENTS, 29900),
      },
    ];
  }

  getSetupBatchOption(tier: SetupBatchTier): SetupBatchOption {
    const option = this.getSetupBatches().find((item) => item.tier === tier);
    if (!option) {
      throw new Error(`Lote de setup inválido: ${String(tier)}`);
    }
    return option;
  }

  getPixConfig(): BillingCatalogSummary['pix'] {
    const key = normalizeOptionalString(process.env.SAAS_PIX_KEY);
    const keyType = normalizeOptionalString(process.env.SAAS_PIX_KEY_TYPE);
    const beneficiary = normalizeOptionalString(process.env.SAAS_PIX_BENEFICIARY);
    return {
      configured: Boolean(key),
      key,
      keyType,
      beneficiary,
    };
  }

  getSupportWhatsapp(): string | null {
    const raw = normalizeOptionalString(process.env.SAAS_SUPPORT_WHATSAPP);
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    return digits.length >= 10 ? digits : null;
  }

  buildWhatsappUrl(message: string): string | null {
    const whatsapp = this.getSupportWhatsapp();
    if (!whatsapp) return null;
    const normalizedDigits = whatsapp.startsWith('55') ? whatsapp : `55${whatsapp}`;
    return `https://wa.me/${normalizedDigits}?text=${encodeURIComponent(message)}`;
  }

  getCatalog(): BillingCatalogSummary {
    return {
      trialDays: this.getTrialDays(),
      monthlyPlan: {
        code: this.getMonthlyPlanCode(),
        name: this.getMonthlyPlanName(),
        priceCents: this.getMonthlyPriceCents(),
        description:
          'Acesso completo ao ERP, PDV/Pedidos, CRM, Financeiro, Campanhas e Catálogo Online no seu subdomínio.',
      },
      setupBatches: this.getSetupBatches(),
      pix: this.getPixConfig(),
      supportWhatsapp: this.getSupportWhatsapp(),
    };
  }
}
