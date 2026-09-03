import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

type AuthState = {
  user: { email: string } | null;
  userData: { name: string; role: 'owner' } | null;
  loading: boolean;
  logout: ReturnType<typeof vi.fn>;
};

const { authState, dashboardGate } = vi.hoisted(() => {
  const state: AuthState = {
    user: { email: 'owner@example.com' },
    userData: { name: 'Owner', role: 'owner' },
    loading: false,
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

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
}));

vi.mock('./pages/LoginPage.tsx', () => ({
  LoginPage: () => <div>Login page</div>,
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

vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => {
  const Icon = () => null;
  return {
    BarChart3: Icon,
    Briefcase: Icon,
    Calculator: Icon,
    DollarSign: Icon,
    LayoutDashboard: Icon,
    Loader2: Icon,
    LogOut: Icon,
    Menu: Icon,
    Package: Icon,
    Percent: Icon,
    Settings: Icon,
    Shield: Icon,
    ShoppingBag: Icon,
    Ticket: Icon,
    Users: Icon,
    X: Icon,
  };
});

describe('App shell com páginas sob demanda', () => {
  beforeEach(() => {
    authState.user = { email: 'owner@example.com' };
    authState.userData = { name: 'Owner', role: 'owner' };
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

    render(<App />);

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
