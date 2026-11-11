import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import type { SubscriptionSummary } from '../types';

const {
  mockOnAuthStateChanged,
  mockSignInWithPopup,
  mockSignInWithRedirect,
  mockGetRedirectResult,
  mockSignOut,
  mockApiGet,
  mockToastError,
  mockToastSuccess,
  expiredHandlerRef,
} = vi.hoisted(() => ({
  mockOnAuthStateChanged: vi.fn(),
  mockSignInWithPopup: vi.fn(),
  mockSignInWithRedirect: vi.fn(),
  mockGetRedirectResult: vi.fn(),
  mockSignOut: vi.fn(),
  mockApiGet: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
  expiredHandlerRef: { current: null as ((sub?: SubscriptionSummary) => void) | null },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithPopup: mockSignInWithPopup,
  signInWithRedirect: mockSignInWithRedirect,
  getRedirectResult: mockGetRedirectResult,
  GoogleAuthProvider: vi.fn(function MockGoogleAuthProvider() {
    return { providerId: 'google.com' };
  }),
  signOut: mockSignOut,
}));

vi.mock('../services/firebase/firebaseConfig', () => ({
  auth: { currentUser: null },
}));

vi.mock('../services/apiService', () => ({
  apiClient: {
    defaults: { headers: { common: {} as Record<string, string> } },
    get: mockApiGet,
  },
  onboardMerchant: vi.fn(),
  registerSubscriptionExpiredHandler: (handler: ((sub?: SubscriptionSummary) => void) | null) => {
    expiredHandlerRef.current = handler;
    return () => {
      if (expiredHandlerRef.current === handler) {
        expiredHandlerRef.current = null;
      }
    };
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

function AuthHarness() {
  const { signInWithGoogle, user, userData } = useAuth();
  return (
    <div>
      <span data-testid="user-email">{user?.email ?? 'anon'}</span>
      <span data-testid="user-role">{userData?.role ?? 'none'}</span>
      <span data-testid="sub-blocked">{String(Boolean(userData?.subscription?.isBlocked))}</span>
      <button type="button" onClick={signInWithGoogle}>
        Entrar
      </button>
    </div>
  );
}

describe('AuthContext (resiliência de login Google / COOP / popup / assinatura)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    expiredHandlerRef.current = null;
    mockGetRedirectResult.mockResolvedValue(null);
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(null);
      return vi.fn();
    });
  });

  it('verifica resultado de redirecionamento ao montar o AuthProvider', async () => {
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockGetRedirectResult).toHaveBeenCalledTimes(1);
    });
  });

  it('faz fallback automático para signInWithRedirect quando popup é bloqueado (auth/popup-blocked)', async () => {
    mockSignInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-blocked' });
    mockSignInWithRedirect.mockResolvedValueOnce(undefined);

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    const btn = await screen.findByRole('button', { name: 'Entrar' });
    await act(async () => {
      btn.click();
    });

    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1);
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('exibe orientação clara quando domínio não está autorizado no Firebase (auth/unauthorized-domain)', async () => {
    mockSignInWithPopup.mockRejectedValueOnce({ code: 'auth/unauthorized-domain' });

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    const btn = await screen.findByRole('button', { name: 'Entrar' });
    await act(async () => {
      btn.click();
    });

    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringMatching(/domínio não autorizado/i),
    );
  });

  it('não exibe toast de erro quando o usuário fecha o popup manualmente', async () => {
    mockSignInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    const btn = await screen.findByRole('button', { name: 'Entrar' });
    await act(async () => {
      btn.click();
    });

    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('mantém sessão autenticada quando trial expirou e aplica bloqueio ao receber evento 402', async () => {
    const fakeFirebaseUser = {
      email: 'lojista@pratas.com',
      getIdToken: vi.fn().mockResolvedValue('jwt-token'),
    };
    mockApiGet.mockResolvedValueOnce({
      data: {
        id: 'tenant-1',
        name: 'Lojista',
        email: 'lojista@pratas.com',
        role: 'admin',
        active: true,
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
          daysRemaining: 4,
        },
      },
    });
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(fakeFirebaseUser);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('user-email')).toHaveTextContent('lojista@pratas.com');
    expect(screen.getByTestId('sub-blocked')).toHaveTextContent('false');
    expect(mockSignOut).not.toHaveBeenCalled();

    act(() => {
      expiredHandlerRef.current?.({
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
      });
    });

    expect(screen.getByTestId('sub-blocked')).toHaveTextContent('true');
    expect(screen.getByTestId('user-email')).toHaveTextContent('lojista@pratas.com');
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
