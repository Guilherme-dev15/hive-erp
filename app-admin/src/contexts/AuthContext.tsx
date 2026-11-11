import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../services/firebase/firebaseConfig';
import toast from 'react-hot-toast';
import { apiClient, onboardMerchant } from '../services/apiService';

export interface UserData {
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

export interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  needsOnboarding: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  completeOnboard: (storeName: string, slug?: string) => Promise<void>;
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

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
      if (currentUser && currentUser.email) {
        try {
          // Prepara o header de autorização ANTES de bater na API
          const token = await currentUser.getIdToken();
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Usa o backend NestJS(PostgreSQL) para verificar a saúde/perfil em vez do Firestore
          const response = await apiClient.get('/api/v2/auth/me');

          if (response.data && response.data.active) {
            setUserData(response.data as UserData);
            setUser(currentUser);
            setNeedsOnboarding(false);
          } else {
            toast.error('Acesso negado. Usuário inativo no ERP.');
            await signOut(auth);
            setUser(null);
            setUserData(null);
            setNeedsOnboarding(false);
            delete apiClient.defaults.headers.common['Authorization'];
          }
        } catch (error: unknown) {
          const status = getHttpErrorStatus(error);
          if (status === 401 || status === 404) {
            // Novo lojista autenticado no Google que ainda não possui loja cadastrada no PostgreSQL
            setUser(currentUser);
            setUserData(null);
            setNeedsOnboarding(true);
          } else {
            console.error('Erro ao validar usuário:', error);
            toast.error('Erro de conexão ao validar permissões.');
            await signOut(auth);
            setUser(null);
            setUserData(null);
            setNeedsOnboarding(false);
            delete apiClient.defaults.headers.common['Authorization'];
          }
        }
      } else {
        setUser(null);
        setUserData(null);
        setNeedsOnboarding(false);
        delete apiClient.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

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

  const completeOnboard = async (storeName: string, slug?: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    const result = await onboardMerchant({
      storeName,
      name: user.displayName || storeName,
      email: user.email || undefined,
      slug: slug || undefined,
    });
    setUserData({
      name: result.name,
      role: result.role,
      active: result.active,
    });
    setNeedsOnboarding(false);
    toast.success(`Loja "${storeName}" criada com sucesso!`);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setNeedsOnboarding(false);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    userData,
    needsOnboarding,
    loading,
    signInWithGoogle,
    completeOnboard,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
