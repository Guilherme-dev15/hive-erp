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
  mockSignInWithEmailAndPassword,
  mockCreateUserWithEmailAndPassword,
  mockSendPasswordResetEmail,
  mockSendEmailVerification,
  mockSignInWithPhoneNumber,
  mockRecaptchaClear,
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
  mockSignInWithEmailAndPassword: vi.fn(),
  mockCreateUserWithEmailAndPassword: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
  mockSendEmailVerification: vi.fn(),
  mockSignInWithPhoneNumber: vi.fn(),
  mockRecaptchaClear: vi.fn(),
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
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  sendEmailVerification: mockSendEmailVerification,
  signInWithPhoneNumber: mockSignInWithPhoneNumber,
  RecaptchaVerifier: vi.fn(function MockRecaptchaVerifier() {
    return { clear: mockRecaptchaClear };
  }),
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
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    checkEmailVerification,
    needsEmailVerification,
    needsOnboarding,
    user,
    userData,
  } = useAuth();
  return (
    <div>
      <span data-testid="user-email">{user?.email ?? 'anon'}</span>
      <span data-testid="user-role">{userData?.role ?? 'none'}</span>
      <span data-testid="sub-blocked">{String(Boolean(userData?.subscription?.isBlocked))}</span>
      <span data-testid="needs-verify">{String(needsEmailVerification)}</span>
      <span data-testid="needs-onboard">{String(needsOnboarding)}</span>
      <button type="button" onClick={signInWithGoogle}>
        Entrar
      </button>
      <button
        type="button"
        onClick={() => {
          signInWithEmail('teste@pratas.com', '123456').catch(() => {});
        }}
      >
        EntrarEmail
      </button>
      <button
        type="button"
        onClick={() => {
          signUpWithEmail('novo@pratas.com', '123456').catch(() => {});
        }}
      >
        CadastrarEmail
      </button>
      <button
        type="button"
        onClick={() => {
          signUpWithEmail('temp@mailinator.com', '123456').catch(() => {});
        }}
      >
        CadastrarDescartavel
      </button>
      <button
        type="button"
        onClick={() => {
          checkEmailVerification().catch(() => {});
        }}
      >
        VerificarEmail
      </button>
      <button
        type="button"
        onClick={() => {
          resetPassword('recuperar@pratas.com').catch(() => {});
        }}
      >
        ResetarSenha
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

  it('permite autenticação via e-mail e senha com tratamento de erro amigável', async () => {
    mockSignInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/wrong-password' });

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    const btn = await screen.findByRole('button', { name: 'EntrarEmail' });
    await act(async () => {
      try {
        btn.click();
      } catch {
        // expected rethrow
      }
    });

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'teste@pratas.com',
      '123456',
    );
    expect(mockToastError).toHaveBeenCalledWith('E-mail ou senha incorretos.');
  });

  it('permite criação de conta e recuperação de senha com e-mail', async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { email: 'novo@pratas.com' },
    });
    mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    const btnSignup = await screen.findByRole('button', { name: 'CadastrarEmail' });
    await act(async () => {
      btnSignup.click();
    });

    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'novo@pratas.com',
      '123456',
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/Conta criada com sucesso/),
    );

    const btnReset = await screen.findByRole('button', { name: 'ResetarSenha' });
    await act(async () => {
      btnReset.click();
    });

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      'recuperar@pratas.com',
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/Instruções de recuperação enviadas/),
    );
    expect(mockSendEmailVerification).toHaveBeenCalledWith({ email: 'novo@pratas.com' });
  });

  it('rejeita e-mail descartável no signUpWithEmail sem criar usuário no Firebase', async () => {
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    const btnDisposable = await screen.findByRole('button', { name: 'CadastrarDescartavel' });
    await act(async () => {
      btnDisposable.click();
    });

    expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringMatching(/temporários não são aceitos/i),
    );
  });

  it('bloqueia usuário password com e-mail não confirmado e libera após checkEmailVerification', async () => {
    const unverifiedUser: any = {
      email: 'pendente@pratas.com',
      emailVerified: false,
      providerData: [{ providerId: 'password' }],
      reload: vi.fn().mockImplementation(async () => {
        unverifiedUser.emailVerified = true;
      }),
      getIdToken: vi.fn().mockResolvedValue('jwt-verified'),
    };
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      cb(unverifiedUser);
      return vi.fn();
    });
    mockApiGet.mockRejectedValueOnce({ response: { status: 404 } });

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('needs-verify')).toHaveTextContent('true');
    expect(mockApiGet).not.toHaveBeenCalled();

    const btnCheck = await screen.findByRole('button', { name: 'VerificarEmail' });
    await act(async () => {
      btnCheck.click();
    });

    expect(unverifiedUser.reload).toHaveBeenCalled();
    expect(await screen.findByTestId('needs-verify')).toHaveTextContent('false');
    expect(await screen.findByTestId('needs-onboard')).toHaveTextContent('true');
  });
});
