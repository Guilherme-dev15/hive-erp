import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssinaturaPage } from './AssinaturaPage';

const {
  mockGetBillingStatus,
  mockCreateCheckoutIntent,
  mockCreateSetupRequest,
  mockCancelSetupRequest,
  mockRefreshAuth,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockGetBillingStatus: vi.fn(),
  mockCreateCheckoutIntent: vi.fn(),
  mockCreateSetupRequest: vi.fn(),
  mockCancelSetupRequest: vi.fn(),
  mockRefreshAuth: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    userData: {
      name: 'Maria Joalheira',
      role: 'admin',
      active: true,
      isSuperAdmin: false,
      store: { id: 'cfg-1', storeName: 'Pratas Teste', slug: 'pratas-teste' },
    },
    refreshAuth: mockRefreshAuth,
  }),
}));

vi.mock('../services/apiService', () => ({
  getBillingStatus: mockGetBillingStatus,
  createBillingCheckoutIntent: mockCreateCheckoutIntent,
  createProductSetupRequest: mockCreateSetupRequest,
  cancelProductSetupRequest: mockCancelSetupRequest,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

const baseStatusResponse = {
  subscription: {
    status: 'TRIAL' as const,
    effectiveStatus: 'TRIAL' as const,
    isBlocked: false,
    isExempt: false,
    planCode: 'PRO_MONTHLY',
    monthlyPriceCents: 9700,
    trialStartsAt: '2026-11-01T00:00:00Z',
    trialEndsAt: '2026-11-15T00:00:00Z',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    daysRemaining: 8,
  },
  catalog: {
    trialDays: 14,
    monthlyPlan: {
      code: 'PRO_MONTHLY',
      name: 'Plano Mensal HiveERP',
      priceCents: 9700,
      description: 'Acesso completo ao ERP e Catálogo.',
    },
    setupBatches: [
      {
        tier: 'UP_TO_200' as const,
        label: 'Setup Lote até 200 produtos',
        description: 'Até 200 produtos cadastrados.',
        maxProducts: 200,
        priceCents: 14900,
      },
      {
        tier: 'UP_TO_300' as const,
        label: 'Setup Lote até 300 produtos',
        description: 'Até 300 produtos cadastrados.',
        maxProducts: 300,
        priceCents: 19900,
      },
      {
        tier: 'UP_TO_500' as const,
        label: 'Setup Lote até 500 produtos',
        description: 'Até 500 produtos cadastrados.',
        maxProducts: 500,
        priceCents: 29900,
      },
    ],
    pix: {
      configured: true,
      key: 'pix-chave-exemplo@hiveerp.com.br',
      keyType: 'E-mail',
      beneficiary: 'HiveERP Tecnologia',
    },
    supportWhatsapp: '5511999998888',
  },
  setupRequests: [
    {
      id: 'req-pending-1',
      batchTier: 'UP_TO_200' as const,
      maxProducts: 200,
      priceCents: 14900,
      includeMonthlyPlan: false,
      monthlyPlanPriceCents: 0,
      totalPriceCents: 14900,
      status: 'PENDING' as const,
      referenceCode: 'HIVE-SETUP-20261111-112233',
      contactPhone: null,
      sourceDescription: null,
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
  ],
  recentBillingEvents: [],
};

describe('AssinaturaPage (Plano Mensal + Order Bump Setup por Lote)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBillingStatus.mockResolvedValue(baseStatusResponse);
  });

  it('permite marcar Order Bump de 300 produtos, calcula o total combinado e exibe instruções Pix/WhatsApp', async () => {
    mockCreateCheckoutIntent.mockResolvedValue({
      referenceCode: 'HIVE-BUMP-20261111-AABBCC',
      monthlyPlanPriceCents: 9700,
      setupBatchTier: 'UP_TO_300',
      setupBatchMaxProducts: 300,
      setupPriceCents: 19900,
      totalPriceCents: 29600,
      pix: baseStatusResponse.catalog.pix,
      supportWhatsapp: '5511999998888',
      whatsappMessage: 'Resumo Teste',
      whatsappUrl: 'https://wa.me/5511999998888?text=Resumo%20Teste',
      setupRequestId: 'setup-new-1',
    });

    render(<AssinaturaPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Plano Mensal HiveERP').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /Até 300 produtos/i }));

    const checkoutBtn = screen.getByRole('button', { name: /Assinar Plano \+ Setup/i });
    expect(checkoutBtn.textContent).toMatch(/296,00/);

    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(mockCreateCheckoutIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          setupBatchTier: 'UP_TO_300',
        }),
      );
    });

    expect(await screen.findByText('HIVE-BUMP-20261111-AABBCC')).toBeInTheDocument();
    expect(screen.getByText('pix-chave-exemplo@hiveerp.com.br')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Enviar Comprovante no WhatsApp/i })).toHaveAttribute(
      'href',
      'https://wa.me/5511999998888?text=Resumo%20Teste',
    );
  });

  it('exibe alerta claro de painel bloqueado com vitrine online quando mode é blocked e permite cancelar solicitação PENDING', async () => {
    mockCancelSetupRequest.mockResolvedValue({
      ...baseStatusResponse.setupRequests[0],
      status: 'CANCELED',
    });

    render(<AssinaturaPage mode="blocked" />);

    expect(
      await screen.findByText(/Seu período de acesso ao painel expirou/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abrir Vitrine Pública/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    await waitFor(() => {
      expect(mockCancelSetupRequest).toHaveBeenCalledWith('req-pending-1');
    });
  });
});
