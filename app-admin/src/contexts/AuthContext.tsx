import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../services/firebase/firebaseConfig';
import toast from 'react-hot-toast';
import { apiClient } from '../services/apiService';

interface UserData {
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          } else {
            toast.error('Acesso negado. Usuário inativo no ERP.');
            await signOut(auth);
            setUser(null);
            setUserData(null);
            delete apiClient.defaults.headers.common['Authorization'];
          }
        } catch (error) {
          console.error('Erro ao validar usuário:', error);
          toast.error('Erro de conexão ao validar permissões. Você possui conta cadastrada?');
          await signOut(auth);
          setUser(null);
          setUserData(null);
          delete apiClient.defaults.headers.common['Authorization'];
        }
      } else {
        setUser(null);
        setUserData(null);
        delete apiClient.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Erro login:', error);
        toast.error('Erro ao conectar com Google.');
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const value = { user, userData, loading, signInWithGoogle, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
