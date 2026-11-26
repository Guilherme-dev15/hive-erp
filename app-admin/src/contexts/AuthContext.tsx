import { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../services/firebase/firebaseConfig';
import toast from 'react-hot-toast';
import {
  apiClient,
  onboardMerchant,
  registerSubscriptionExpiredHandler,
} from '../services/apiService';
import type { SubscriptionSummary } from '../types';
import {
  normalizeBrazilPhoneToE164,
  validateRegistrationEmail,
} from '../utils/authValidation';

export interface StoreSummary {
  id: string;
  storeName: string;
  slug: string | null;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UserData {
  id?: string;
  email?: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
  isSuperAdmin?: boolean;
  store?: StoreSummary | null;
  subscription?: SubscriptionSummary;
}

export interface OnboardExtraOptions {
  phone?: string;
  email?: string;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  needsOnboarding: boolean;
  needsEmailVerification: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  sendPhoneCode: (phone: string, recaptchaContainerId?: string) => Promise<void>;
  confirmPhoneCode: (code: string) => Promise<void>;
  completeOnboard: (
    storeName: string,
    slug?: string,
    extra?: OnboardExtraOptions,
  ) => Promise<void>;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

interface AuthProviderProps {
  children: ReactNode;
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function getHttpErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: unknown }).response;
    if (typeof response === 'object' && response !== null && 'status' in response) {
      const status = (response as { status?: unknown }).status;
      return typeof status === 'number' ? status : undefined;
    }
  }
  return undefined;
}

function getApiErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: unknown }).response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = (response as { data?: unknown }).data;
      if (typeof data === 'object' && data !== null && 'code' in data) {
        const code = (data as { code?: unknown }).code;
        return typeof code === 'string' ? code : undefined;
      }
    }
  }
  return undefined;
}

function isUnverifiedPasswordUser(currentUser: User): boolean {
  const providers = Array.isArray(currentUser.providerData) ? currentUser.providerData : [];
  const isPasswordUser = providers.some((provider) => provider?.providerId === 'password');
  return isPasswordUser && currentUser.emailVerified === false;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [loading, setLoading] = useState(true);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const fetchAndApplyMe = useCallback(async (currentUser: User) => {
    const token = await currentUser.getIdToken();
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const response = await apiClient.get('/api/v2/auth/me');
    const meData = response.data as UserData;

    if (meData && meData.active) {
      setUserData(meData);
      setUser(currentUser);
      setNeedsOnboarding(false);
      setNeedsEmailVerification(false);
    } else {
      toast.error('Acesso negado. Usuário inativo no ERP.');
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setNeedsOnboarding(false);
      setNeedsEmailVerification(false);
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, []);

  useEffect(() => {
    if (typeof registerSubscriptionExpiredHandler !== 'function') {
      return undefined;
    }

    return registerSubscriptionExpiredHandler((blockedSub) => {
      setUserData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subscription: blockedSub ?? {
            status: prev.subscription?.status ?? 'TRIAL',
            effectiveStatus: 'EXPIRED',
            isBlocked: true,
            isExempt: false,
            planCode: prev.subscription?.planCode ?? 'PRO_MONTHLY',
            monthlyPriceCents: prev.subscription?.monthlyPriceCents ?? 9700,
            trialStartsAt: prev.subscription?.trialStartsAt ?? new Date().toISOString(),
            trialEndsAt: prev.subscription?.trialEndsAt ?? new Date().toISOString(),
            currentPeriodStart: prev.subscription?.currentPeriodStart ?? null,
            currentPeriodEnd: prev.subscription?.currentPeriodEnd ?? null,
            daysRemaining: 0,
          },
        };
      });
    });
  }, []);

  useEffect(() => {
    let active = true;

    getRedirectResult(auth).catch((error: unknown) => {
      if (!active) return;
      const code = getErrorCode(error);
      if (code === 'auth/unauthorized-domain') {
        toast.error('Domínio não autorizado no Firebase Auth. Verifique a configuração de domínios autorizados.');
      } else if (code && code !== 'auth/null-user') {
        console.error('Erro ao processar redirecionamento Google:', error);
        toast.error('Erro ao conectar com Google.');
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && (currentUser.email || currentUser.phoneNumber)) {
        if (isUnverifiedPasswordUser(currentUser)) {
          setUser(currentUser);
          setUserData(null);
          setNeedsOnboarding(false);
          setNeedsEmailVerification(true);
          delete apiClient.defaults.headers.common['Authorization'];
          setLoading(false);
          return;
        }

        setNeedsEmailVerification(false);
        try {
          await fetchAndApplyMe(currentUser);
        } catch (error: unknown) {
          const status = getHttpErrorStatus(error);
          const apiCode = getApiErrorCode(error);
          if (status === 403 && apiCode === 'EMAIL_NOT_VERIFIED') {
            setUser(currentUser);
            setUserData(null);
            setNeedsOnboarding(false);
            setNeedsEmailVerification(true);
          } else if (status === 401 || status === 404) {
            setUser(currentUser);
            setUserData(null);
            setNeedsOnboarding(true);
          } else {
            console.error('Erro ao validar usuário no backend:', error);
            try {
              await new Promise((resolve) => setTimeout(resolve, 1500));
              await fetchAndApplyMe(currentUser);
            } catch (retryError: unknown) {
              const retryStatus = getHttpErrorStatus(retryError);
              const retryApiCode = getApiErrorCode(retryError);
              if (retryStatus === 403 && retryApiCode === 'EMAIL_NOT_VERIFIED') {
                setUser(currentUser);
                setUserData(null);
                setNeedsOnboarding(false);
                setNeedsEmailVerification(true);
              } else if (retryStatus === 401 || retryStatus === 404) {
                setUser(currentUser);
                setUserData(null);
                setNeedsOnboarding(true);
              } else {
                console.error('Falha na tentativa de reconexão:', retryError);
                toast.error('Instabilidade temporária na conexão com o servidor. Tente recarregar a página.');
                setUser(currentUser);
                setUserData(null);
                setNeedsOnboarding(false);
              }
            }
          }
        }
      } else {
        setUser(null);
        setUserData(null);
        setNeedsOnboarding(false);
        setNeedsEmailVerification(false);
        delete apiClient.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [fetchAndApplyMe]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      const code = getErrorCode(error);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }

      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError: unknown) {
          console.error('Erro login redirect:', redirectError);
          toast.error('Erro ao conectar com Google.');
          return;
        }
      }

      if (code === 'auth/unauthorized-domain') {
        console.error('Erro login (domínio não autorizado):', error);
        toast.error('Domínio não autorizado no Firebase Auth. Verifique a configuração de domínios autorizados.');
        return;
      }

      console.error('Erro login:', error);
      toast.error('Erro ao conectar com Google.');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!email || !password) {
      toast.error('Preencha seu e-mail e senha.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: unknown) {
      const code = getErrorCode(error);
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        toast.error('E-mail ou senha incorretos.');
      } else if (code === 'auth/invalid-email') {
        toast.error('E-mail inválido. Verifique a digitação.');
      } else if (code === 'auth/user-disabled') {
        toast.error('Esta conta foi desativada ou suspensa. Contate o suporte.');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Muitas tentativas sem sucesso. Aguarde alguns minutos e tente novamente.');
      } else if (code === 'auth/network-request-failed') {
        toast.error('Erro de conexão com o servidor. Verifique sua internet.');
      } else {
        console.error('Erro login e-mail/senha:', error);
        toast.error('Não foi possível entrar. Verifique os dados e tente novamente.');
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!email || !password) {
      toast.error('Preencha seu e-mail e uma senha com pelo menos 6 dígitos.');
      return;
    }
    const validation = validateRegistrationEmail(email);
    if (!validation.valid) {
      toast.error(validation.reason || 'Informe um e-mail válido.');
      throw new Error(validation.reason || 'E-mail inválido');
    }
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (cred?.user && typeof sendEmailVerification === 'function') {
        try {
          await sendEmailVerification(cred.user);
        } catch (verifyErr) {
          console.warn('Falha ao enviar e-mail de confirmação automático:', verifyErr);
        }
      }
      setNeedsEmailVerification(true);
      toast.success('Conta criada com sucesso! Enviamos um link de confirmação para o seu e-mail.');
    } catch (error: unknown) {
      const code = getErrorCode(error);
      if (code === 'auth/email-already-in-use') {
        toast.error('Este e-mail já está em uso. Tente entrar ou recuperar sua senha.');
      } else if (code === 'auth/invalid-email') {
        toast.error('E-mail inválido. Verifique o formato digitado.');
      } else if (code === 'auth/weak-password') {
        toast.error('Senha fraca. Escolha uma senha com no mínimo 6 caracteres.');
      } else if (code === 'auth/network-request-failed') {
        toast.error('Erro de conexão com o servidor. Verifique sua internet.');
      } else {
        console.error('Erro cadastro e-mail/senha:', error);
        toast.error('Não foi possível criar sua conta. Tente novamente.');
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!email) {
      toast.error('Informe o e-mail da sua conta.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success('Instruções de recuperação enviadas para seu e-mail! Verifique a caixa de entrada e spam.');
    } catch (error: unknown) {
      const code = getErrorCode(error);
      if (code === 'auth/user-not-found') {
        toast.error('Nenhuma conta encontrada com este e-mail.');
      } else if (code === 'auth/invalid-email') {
        toast.error('E-mail inválido.');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Muitas solicitações seguidas. Aguarde alguns minutos.');
      } else {
        console.error('Erro reset password:', error);
        toast.error('Falha ao enviar e-mail de recuperação. Tente novamente.');
      }
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    const activeUser = auth.currentUser ?? user;
    if (!activeUser) {
      toast.error('Sessão não encontrada. Faça login novamente.');
      return;
    }
    try {
      await sendEmailVerification(activeUser);
      toast.success('Novo link de confirmação enviado! Verifique sua caixa de entrada e spam.');
    } catch (error: unknown) {
      const code = getErrorCode(error);
      if (code === 'auth/too-many-requests') {
        toast.error('Aguarde um minuto antes de solicitar outro e-mail.');
      } else {
        console.error('Erro ao reenviar confirmação de e-mail:', error);
        toast.error('Não foi possível reenviar o e-mail. Tente novamente em instantes.');
      }
      throw error;
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    const activeUser = auth.currentUser ?? user;
    if (!activeUser) {
      toast.error('Sessão não encontrada. Faça login novamente.');
      return false;
    }

    try {
      if (typeof activeUser.reload === 'function') {
        await activeUser.reload();
      }
      const refreshedUser = auth.currentUser ?? activeUser;
      await refreshedUser.getIdToken(true);

      if (!refreshedUser.emailVerified) {
        toast.error('E-mail ainda não confirmado. Clique no link enviado para sua caixa de entrada ou spam.');
        return false;
      }

      setNeedsEmailVerification(false);
      toast.success('E-mail confirmado com sucesso!');
      try {
        await fetchAndApplyMe(refreshedUser);
      } catch (err: unknown) {
        const status = getHttpErrorStatus(err);
        if (status === 401 || status === 404) {
          setUser(refreshedUser);
          setUserData(null);
          setNeedsOnboarding(true);
        } else {
          throw err;
        }
      }
      return true;
    } catch (error) {
      console.error('Erro ao verificar confirmação de e-mail:', error);
      toast.error('Não foi possível validar a confirmação agora. Tente novamente.');
      return false;
    }
  };

  const sendPhoneCode = async (
    phone: string,
    recaptchaContainerId: string = 'recaptcha-phone-container',
  ) => {
    const e164 = normalizeBrazilPhoneToE164(phone);
    if (!e164) {
      toast.error('Informe um telefone válido com DDD. Ex: (11) 99999-8888');
      throw new Error('Telefone inválido');
    }

    try {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore cleanup failures
        }
        recaptchaVerifierRef.current = null;
      }

      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
      });
      recaptchaVerifierRef.current = verifier;

      const confirmation = await signInWithPhoneNumber(auth, e164, verifier);
      confirmationRef.current = confirmation;
      toast.success('Código SMS enviado! Digite os 6 dígitos recebidos.');
    } catch (error: unknown) {
      const code = getErrorCode(error);
      if (code === 'auth/operation-not-allowed' || code === 'auth/billing-not-enabled') {
        toast.error('Login por SMS ainda está sendo ativado no provedor. Use Google ou E-mail com confirmação.');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Muitas tentativas. Aguarde alguns minutos.');
      } else if (code === 'auth/invalid-phone-number') {
        toast.error('Número de telefone inválido.');
      } else {
        console.error('Erro ao enviar SMS:', error);
        toast.error('Não foi possível enviar o código SMS. Tente novamente.');
      }
      throw error;
    }
  };

  const confirmPhoneCode = async (code: string) => {
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      toast.error('Digite o código de 6 dígitos enviado por SMS.');
      return;
    }
    if (!confirmationRef.current) {
      toast.error('Solicite o código SMS primeiro.');
      return;
    }

    try {
      await confirmationRef.current.confirm(cleanCode);
      confirmationRef.current = null;
      toast.success('Telefone confirmado com sucesso!');
    } catch (error: unknown) {
      const errCode = getErrorCode(error);
      if (errCode === 'auth/invalid-verification-code') {
        toast.error('Código SMS incorreto. Confira os 6 dígitos.');
      } else if (errCode === 'auth/code-expired') {
        toast.error('Código expirado. Solicite um novo SMS.');
      } else {
        console.error('Erro ao confirmar SMS:', error);
        toast.error('Não foi possível confirmar o código SMS.');
      }
      throw error;
    }
  };

  const completeOnboard = async (
    storeName: string,
    slug?: string,
    extra?: OnboardExtraOptions,
  ) => {
    if (!user) throw new Error('Usuário não autenticado');
    const result = await onboardMerchant({
      storeName,
      name: extra?.name || user.displayName || storeName,
      email: user.email || extra?.email || undefined,
      phone: extra?.phone || user.phoneNumber || undefined,
      slug: slug || undefined,
    });
    setUserData({
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      active: result.active,
      isSuperAdmin: result.isSuperAdmin,
      store: result.store,
      subscription: result.subscription,
    });
    setNeedsOnboarding(false);
    toast.success(`Loja "${storeName}" criada com sucesso!`);
  };

  const refreshAuth = useCallback(async () => {
    const activeUser = auth.currentUser ?? user;
    if (!activeUser) return;
    await fetchAndApplyMe(activeUser);
  }, [user, fetchAndApplyMe]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setNeedsOnboarding(false);
    setNeedsEmailVerification(false);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    userData,
    needsOnboarding,
    needsEmailVerification,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    resendVerificationEmail,
    checkEmailVerification,
    sendPhoneCode,
    confirmPhoneCode,
    completeOnboard,
    refreshAuth,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
