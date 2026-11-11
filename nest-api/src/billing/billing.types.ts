import { BillingActionType, SetupBatchTier, SetupRequestStatus, SubscriptionStatus } from '@prisma/client';

export interface SubscriptionAccessSummary {
  status: SubscriptionStatus;
  effectiveStatus: SubscriptionStatus;
  isBlocked: boolean;
  isExempt: boolean;
  planCode: string;
  monthlyPriceCents: number;
  trialStartsAt: Date;
  trialEndsAt: Date;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  daysRemaining: number | null;
}

export interface SetupBatchOption {
  tier: SetupBatchTier;
  label: string;
  description: string;
  maxProducts: number;
  priceCents: number;
}

export interface BillingCatalogSummary {
  trialDays: number;
  monthlyPlan: {
    code: string;
    name: string;
    priceCents: number;
    description: string;
  };
  setupBatches: SetupBatchOption[];
  pix: {
    configured: boolean;
    key: string | null;
    keyType: string | null;
    beneficiary: string | null;
  };
  supportWhatsapp: string | null;
}

export interface BillingCheckoutIntentResult {
  referenceCode: string;
  monthlyPlanPriceCents: number;
  setupBatchTier: SetupBatchTier | null;
  setupBatchMaxProducts: number | null;
  setupPriceCents: number;
  totalPriceCents: number;
  pix: BillingCatalogSummary['pix'];
  supportWhatsapp: string | null;
  whatsappMessage: string;
  whatsappUrl: string | null;
  setupRequestId: string | null;
}

export interface BillingEventSummary {
  id: string;
  action: BillingActionType;
  amountCents: number | null;
  daysGranted: number | null;
  referenceCode: string | null;
  note: string | null;
  createdAt: Date;
}

export interface ProductSetupRequestSummary {
  id: string;
  batchTier: SetupBatchTier;
  maxProducts: number;
  priceCents: number;
  includeMonthlyPlan: boolean;
  monthlyPlanPriceCents: number;
  totalPriceCents: number;
  status: SetupRequestStatus;
  referenceCode: string;
  contactPhone: string | null;
  sourceDescription: string | null;
  whatsappMessage: string | null;
  adminNotes: string | null;
  importedCount: number | null;
  paidAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
