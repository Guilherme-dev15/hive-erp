import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

import type { SubscriptionSummary } from './types';

type AuthState = {
  user: { email: string } | null;
  userData: {
    name: string;
    role: 'owner' | 'admin';
    isSuperAdmin?: boolean;
    store?: { id: string; storeName: string; slug: string | null };
    subscription?: SubscriptionSummary;
  } | null;
  needsOnboarding?: boolean;
  loading: boolean;
  refreshAuth?: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
};

const { authState, dashboardGate } = vi.hoisted(() => {
  const state: AuthState = {
    user: { email: 'owner@example.com' },
    userData: { name: 'Owner', role: 'owner' },
    needsOnboarding: false,
    loading: false,
    refreshAuth: vi.fn(),
    logout: vi.fn(),
  };

  let releasePending: () => void = () => undefined;
  const gate = {
    pending: false,
    promise: Promise.resolve(),
    hold() {
      gate.pending = true;
      gate.promise = new Promise<void>((resolve) => {
        releasePending = resolve;
      });
    },
    release() {
      gate.pending = false;
      releasePending();
    },
    reset() {
      gate.pending = false;
      gate.promise = Promise.resolve();
      releasePending = () => undefined;
    },
  };

  return { authState: state, dashboardGate: gate };
});


vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({
    theme: {
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
      storeName: 'Hive ERP',
      slug: 'hive',
    },
    setTheme: vi.fn(),
    refreshTheme: vi.fn(),
    loadingTheme: false,
  }),
}));

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
}));

vi.mock('./pages/LoginPage.tsx', () => ({
  LoginPage: () => <div>Login page</div>,
}));

vi.mock('./pages/OnboardingPage.tsx', () => ({
  OnboardingPage: () => <div>Onboarding page</div>,
}));

vi.mock('./pages/DashboardPage', () => ({
  DashboardPage: () => {
    if (dashboardGate.pending) throw dashboardGate.promise;
    return <div>Dashboard lazy page</div>;
  },
}));

vi.mock('./pages/RelatoriosPage', () => ({
  RelatoriosPage: () => <div>Relatórios lazy page</div>,
}));

vi.mock('./pages/AssinaturaPage', () => ({
  AssinaturaPage: ({ mode }: { mode?: string }) => (
    <div>Assinatura lazy page ({mode || 'normal'})</div>
  ),
}));

vi.mock('./pages/SuperAdminPage', () => ({
  SuperAdminPage: () => <div>SuperAdmin lazy page</div>,
}));

vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => {
  const Icon = () => null;
  return {
    BarChart3: Icon,
    Briefcase: Icon,
    Calculator: Icon,
    Clock: Icon,
    CreditCard: Icon,
    DollarSign: Icon,
    ExternalLink: Icon,
    Globe: Icon,
    LayoutDashboard: Icon,
    Loader2: Icon,
    Lock: Icon,
    LogOut: Icon,
    Menu: Icon,
    Package: Icon,
    Percent: Icon,
    Settings: Icon,
    Shield: Icon,
    ShieldCheck: Icon,
    ShoppingBag: Icon,
    Tags: Icon,
    Ticket: Icon,
    UserCheck: Icon,
    Users: Icon,
    X: Icon,
  };
});

describe('App shell com páginas sob demanda', () => {
  beforeEach(() => {
    authState.user = { email: 'owner@example.com' };
    authState.userData = { name: 'Owner', role: 'owner' };
    authState.needsOnboarding = false;
    authState.loading = false;
    dashboardGate.reset();
  });

  it('exibe fallback durante o carregamento e renderiza Dashboard após resolver o chunk', async () => {
    dashboardGate.hold();
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando página...');

    dashboardGate.release();
    expect(await screen.findByText('Dashboard lazy page')).toBeInTheDocument();
  });

  it('navega para outra página lazy sem desmontar o shell', async () => {
    render(<App />);
    expect(await screen.findByText('Dashboard lazy page')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Relatórios/i }));

    expect(await screen.findByText('Relatórios lazy page')).toBeInTheDocument();
    expect(screen.getByText('HIVE ERP')).toBeInTheDocument();
  });

  it('mantém o login como fallback quando não há usuário autenticado', () => {
    authState.user = null;
    authState.userData = null;
    authState.needsOnboarding = false;

    render(<App />);

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renderiza OnboardingPage quando needsOnboarding for true', () => {
    authState.user = { email: 'novolojista@example.com' };
    authState.userData = null;
    authState.needsOnboarding = true;

    render(<App />);

    expect(screen.getByText('Onboarding page')).toBeInTheDocument();
  });

  it('exibe TrialBanner para lojista em período de teste e navega para AssinaturaPage', async () => {
    authState.userData = {
      name: 'Lojista Trial',
      role: 'admin',
      isSuperAdmin: false,
      subscription: {
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
        daysRemaining: 9,
      },
    };

    render(<App />);

    expect(await screen.findByText(/restam 9 dias de acesso completo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Assinar Plano ou Setup/i }));

    expect(await screen.findByText('Assinatura lazy page (normal)')).toBeInTheDocument();
  });

  it('renderiza BlockedSubscriptionShell com AssinaturaPage em modo blocked quando trial expirou', async () => {
    authState.userData = {
      name: 'Lojista Expirado',
      role: 'admin',
      isSuperAdmin: false,
      store: { id: 'cfg-1', storeName: 'Pratas Teste', slug: 'pratas-teste' },
      subscription: {
        status: 'TRIAL',
        effectiveStatus: 'EXPIRED',
        isBlocked: true,
        isExempt: false,
        planCode: 'PRO_MONTHLY',
        monthlyPriceCents: 9700,
        trialStartsAt: '2026-10-01T00:00:00Z',
        trialEndsAt: '2026-10-15T00:00:00Z',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        daysRemaining: 0,
      },
    };

    render(<App />);

    expect(await screen.findByText('Assinatura lazy page (blocked)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Relatórios/i })).not.toBeInTheDocument();
    expect(screen.getByText('Vitrine Pública Online')).toBeInTheDocument();
  });

  it('exibe SuperAdminPage apenas quando isSuperAdmin for true', async () => {
    authState.userData = {
      name: 'Super Admin',
      role: 'admin',
      isSuperAdmin: true,
    };

    render(<App />);

    const superAdminBtn = await screen.findByRole('button', { name: /Super Admin/i });
    fireEvent.click(superAdminBtn);

    expect(await screen.findByText('SuperAdmin lazy page')).toBeInTheDocument();
  });
});
