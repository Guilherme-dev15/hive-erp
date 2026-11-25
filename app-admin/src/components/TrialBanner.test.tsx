import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrialBanner } from './TrialBanner';
import type { SubscriptionSummary } from '../types';

const baseSub: SubscriptionSummary = {
  status: 'TRIAL',
  effectiveStatus: 'TRIAL',
  isBlocked: false,
  isExempt: false,
  planCode: 'PRO_MONTHLY',
  monthlyPriceCents: 9700,
  trialStartsAt: '2026-11-01T00:00:00Z',
  trialEndsAt: '2026-11-15T00:00:00Z',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  daysRemaining: 10,
};

describe('TrialBanner', () => {
  it('exibe estilo normal e calmo quando restam mais de 3 dias', () => {
    const handleGoToBilling = vi.fn();
    render(<TrialBanner subscription={{ ...baseSub, daysRemaining: 7 }} onGoToBilling={handleGoToBilling} />);

    expect(screen.getByText(/restam 7 dias de acesso completo/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Assinar Plano ou Setup/i });
    fireEvent.click(btn);
    expect(handleGoToBilling).toHaveBeenCalledTimes(1);
  });

  it('exibe estilo de atenção quando restam entre 2 e 3 dias', () => {
    const handleGoToBilling = vi.fn();
    render(<TrialBanner subscription={{ ...baseSub, daysRemaining: 2 }} onGoToBilling={handleGoToBilling} />);

    expect(screen.getByText(/Resta\(m\) 2 dia\(s\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Assinar Plano \/ Setup/i })).toBeInTheDocument();
  });

  it('exibe estilo crítico com alerta vermelho no último dia (≤ 1 dia)', () => {
    const handleGoToBilling = vi.fn();
    render(<TrialBanner subscription={{ ...baseSub, daysRemaining: 1 }} onGoToBilling={handleGoToBilling} />);

    expect(screen.getByText(/Último Dia de Teste Grátis/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ativar Agora via Pix/i })).toBeInTheDocument();
  });
});
