import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Importa a configuração
import { toast } from 'react-hot-toast'; // Importamos o 'toast' para dar o feedback de erro

// --- 1. LISTA DE ADMINS (A "ALLOW-LIST") ---
// Adicione aqui todos os emails que podem aceder ao painel
const adminEmails = [
  'seu-email-principal@gmail.com',
  'outro-email-seu@gmail.com'
];
// -------------------------------------------

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Escuta alterações no estado de autenticação (Login/Logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      
      // --- 2. LÓGICA DO "GATEKEEPER" ---
      if (currentUser) {
        // Utilizador fez login. VERIFICAMOS se ele tem permissão.
        if (adminEmails.includes(currentUser.email || '')) {
          // PERMITIDO: O email está na lista.
          setUser(currentUser);
        } else {
          // NÃO PERMITIDO: O email não está na lista.
          toast.error("Você não tem permissão para aceder a esta área.");
          firebaseSignOut(auth); // Expulsa o utilizador
          setUser(null);
        }
      } else {
        // Utilizador fez logout
        setUser(null);
      }
      setLoading(false);
      // --- FIM DA LÓGICA ---
    });
    
    return unsubscribe;
  }, []);

  // Função de Login com Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      throw error;
    }
  };

  // Função de Logout
  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}