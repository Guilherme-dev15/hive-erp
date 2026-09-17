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

vi.mock('./pages/ProdutosPage', () => ({
  ProdutosPage: () => <div>Produtos lazy page</div>,
}));

vi.mock('./routing', async () => {
  const actual = await vi.importActual<typeof import('./routing')>('./routing');
  return actual;
});

vi.mock('./services/firebase/firebaseConfig', () => ({
  auth: {},
  storage: {},
  db: {},
}));

vi.mock('./services/apiService', () => ({
  apiClient: { defaults: { headers: { common: {} } } },
}));

vi.mock('./pages/FornecedoresPage', () => ({
  FornecedoresPage: () => <div>Fornecedores lazy page</div>,
}));

vi.mock('./pages/FinanceiroPage', () => ({
  FinanceiroPage: () => <div>Financeiro lazy page</div>,
}));

vi.mock('./pages/PrecificacaoPage', () => ({
  PrecificacaoPage: () => <div>Precificação lazy page</div>,
}));

vi.mock('./pages/ConfiguracoesPage', () => ({
  ConfiguracoesPage: () => <div>Configurações lazy page</div>,
}));

vi.mock('./pages/PedidosPage', () => ({
  PedidosPage: () => <div>Pedidos lazy page</div>,
}));

vi.mock('./pages/CuponsPage', () => ({
  CuponsPage: () => <div>Cupons lazy page</div>,
}));

vi.mock('./pages/EquipePage', () => ({
  EquipePage: () => <div>Equipe lazy page</div>,
}));

vi.mock('./pages/CampanhasPage', () => ({
  CampanhasPage: () => <div>Campanhas lazy page</div>,
}));

vi.mock('@react-pdf/renderer', () => ({}));
vi.mock('react-to-print', () => ({ useReactToPrint: () => vi.fn() }));
vi.mock('react-qr-code', () => ({ default: () => null }));
vi.mock('firebase/storage', () => ({
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/firestore', () => ({ getFirestore: vi.fn() }));
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(false),
}));
vi.mock('firebase-admin/auth', () => ({ getAuth: vi.fn() }));
vi.mock('./pages/LoginPage.tsx', () => ({
  LoginPage: () => <div>Login page</div>,
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
    window.history.replaceState({}, '', '/');
    authState.user = { email: 'owner@example.com' };
    authState.userData = { name: 'Owner', role: 'owner' };
    authState.loading = false;
    dashboardGate.reset();
  });

  it('abre diretamente a página de produtos pelo deep link', async () => {
    window.history.replaceState({}, '', '/admin/produtos?q=SKU-123');
    render(<App />);

    expect(await screen.findByText('Produtos lazy page')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/produtos');
    expect(window.location.search).toBe('?q=SKU-123');
  });

  it('atualiza o histórico ao navegar e responde ao botão voltar', async () => {
    render(<App />);
    expect(await screen.findByText('Dashboard lazy page')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Relatórios/i }));
    expect(await screen.findByText('Relatórios lazy page')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/relatorios');

    window.history.back();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(await screen.findByText('Dashboard lazy page')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin');
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
