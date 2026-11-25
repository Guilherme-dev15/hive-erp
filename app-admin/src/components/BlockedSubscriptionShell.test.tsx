import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BlockedSubscriptionShell } from './BlockedSubscriptionShell';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'lojista@pratas.com' },
    userData: {
      store: { storeName: 'Pratas da Villa', slug: 'pratas-da-villa' },
    },
    logout: vi.fn(),
  }),
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: { storeName: 'Pratas da Villa', slug: 'pratas-da-villa' },
  }),
}));

describe('BlockedSubscriptionShell', () => {
  it('renderiza o shell com cabeçalho e tranquiliza o lojista sobre a vitrine pública online', () => {
    render(
      <BlockedSubscriptionShell>
        <div data-testid="child-content">Conteúdo da Assinatura</div>
      </BlockedSubscriptionShell>
    );

    expect(screen.getByText('HIVE ERP')).toBeInTheDocument();
    expect(screen.getByText('Pratas da Villa')).toBeInTheDocument();
    expect(screen.getByText(/Sua Vitrine Pública Continua 100% Online/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Suporte WhatsApp/i })).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
