import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SuperAdminPage } from './SuperAdminPage';

const {
  mockGetOverview,
  mockGetTenants,
  mockUpdateTenantSub,
  mockGetSetupRequests,
  mockUpdateSetupRequest,
  mockImportForTenant,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockGetOverview: vi.fn(),
  mockGetTenants: vi.fn(),
  mockUpdateTenantSub: vi.fn(),
  mockGetSetupRequests: vi.fn(),
  mockUpdateSetupRequest: vi.fn(),
  mockImportForTenant: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('../services/apiService', () => ({
  getSuperAdminOverview: mockGetOverview,
  getSuperAdminTenants: mockGetTenants,
  updateTenantSubscription: mockUpdateTenantSub,
  getSuperAdminSetupRequests: mockGetSetupRequests,
  updateSuperAdminSetupRequest: mockUpdateSetupRequest,
  importProductsForTenant: mockImportForTenant,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: vi.fn(),
  },
}));

describe('SuperAdminPage (Gestão de Lojas, Trials e Order Bumps)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOverview.mockResolvedValue({
      totalTenants: 4,
      trialTenants: 2,
      activePaidTenants: 1,
      exemptTenants: 1,
      expiredOrCanceledTenants: 0,
      suspendedTenants: 0,
      pendingSetupRequests: 1,
      inProgressSetupRequests: 0,
      completedSetupRequests: 0,
      estimatedMrrCents: 9700,
      setupRevenueCents: 0,
    });
    mockGetTenants.mockResolvedValue([
      {
        id: 'tenant-b',
        name: 'Maria Joalheira',
        email: 'maria@pratas.com',
        active: true,
        createdAt: '2026-11-01T10:00:00Z',
        storeName: 'Pratas do Brasil',
        slug: 'pratas-brasil',
        whatsappNumber: '5511988887777',
        productsCount: 12,
        ordersCount: 3,
        openSetupRequestsCount: 1,
        subscription: {
          status: 'TRIAL',
          effectiveStatus: 'TRIAL',
          isBlocked: false,
          isExempt: false,
          planCode: 'PRO_MONTHLY',
          monthlyPriceCents: 9700,
          trialStartsAt: '2026-11-01T10:00:00Z',
          trialEndsAt: '2026-11-15T10:00:00Z',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          daysRemaining: 4,
        },
      },
    ]);
    mockGetSetupRequests.mockResolvedValue([
      {
        id: 'setup-1',
        userId: 'tenant-b',
        storeName: 'Pratas do Brasil',
        slug: 'pratas-brasil',
        ownerName: 'Maria Joalheira',
        ownerEmail: 'maria@pratas.com',
        storeWhatsapp: '5511988887777',
        batchTier: 'UP_TO_200',
        maxProducts: 200,
        priceCents: 14900,
        includeMonthlyPlan: true,
        monthlyPlanPriceCents: 9700,
        totalPriceCents: 24600,
        status: 'PENDING',
        referenceCode: 'HIVE-BUMP-20261111-1234',
        contactPhone: '11988887777',
        sourceDescription: 'Planilha fornecedor',
        whatsappMessage: null,
        adminNotes: null,
        importedCount: null,
        paidAt: null,
        startedAt: null,
        completedAt: null,
        canceledAt: null,
        createdAt: '2026-11-11T10:00:00Z',
        updatedAt: '2026-11-11T10:00:00Z',
      },
    ]);
  });

  it('exibe KPIs, lista lojas e ativa +30 dias de assinatura para lojista', async () => {
    mockUpdateTenantSub.mockResolvedValue({ userId: 'tenant-b', active: true });

    render(<SuperAdminPage />);

    expect(await screen.findByText('Pratas do Brasil')).toBeInTheDocument();
    expect(screen.getByText('maria@pratas.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /\+30d Ativar/i }));

    await waitFor(() => {
      expect(mockUpdateTenantSub).toHaveBeenCalledWith(
        'tenant-b',
        expect.objectContaining({
          action: 'ACTIVATE_MONTHLY',
          days: 30,
        }),
      );
    });
  });

  it('alterna para aba de Order Bump & Setup e confirma pagamento combinado com ativação mensal', async () => {
    mockUpdateSetupRequest.mockResolvedValue({ setupRequest: { id: 'setup-1', status: 'PAID' } });

    render(<SuperAdminPage />);

    const setupsTab = await screen.findByRole('button', {
      name: /Order Bump & Setup por Lote/i,
    });
    fireEvent.click(setupsTab);

    expect(await screen.findByText('HIVE-BUMP-20261111-1234')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pago \+ Ativar Plano/i }));

    await waitFor(() => {
      expect(mockUpdateSetupRequest).toHaveBeenCalledWith(
        'setup-1',
        expect.objectContaining({
          status: 'PAID',
          activateMonthlyPlanToo: true,
        }),
      );
    });
  });
});
