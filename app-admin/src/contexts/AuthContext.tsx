import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Sua configuração do Firebase
import { toast } from 'react-hot-toast';
import { apiClient } from '../services/apiService'; // <--- IMPORTANTE: Importe seu cliente API

// --- 1. LISTA DE ADMINS (A "ALLOW-LIST") ---
// Só quem estiver aqui consegue ver dados e falar com o backend
const adminEmails = [
  'hivepratas@gmail.com',
  // 'seu.email.pessoal@gmail.com' 
];
// -------------------------------------------

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>; // Padronizei para signInGoogle
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      
      // --- LÓGICA DO "GATEKEEPER" + API ---
      if (currentUser) {
        
        // 1. Verifica Permissão (Allow-list)
        if (adminEmails.includes(currentUser.email || '')) {
          
          try {
            // 2. PEGAR O TOKEN JWT (A Chave do Cofre)
            const token = await currentUser.getIdToken();
            
            // 3. INJETAR NO AXIOS (Para o Backend aceitar as requisições)
            // A partir de agora, toda chamada api.get/post vai com esse token
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser(currentUser);
            // toast.success("Login autorizado!"); // Opcional
          } catch (error) {
            console.error("Erro ao obter token", error);
            setUser(null);
          }

        } else {
          // NÃO PERMITIDO: O email não está na lista.
          toast.error("Acesso negado. Este e-mail não é administrador.");
          await firebaseSignOut(auth); // Expulsa o utilizador no Firebase
          
          // Limpa o token da API por segurança
          delete apiClient.defaults.headers.common['Authorization'];
          setUser(null);
        }

      } else {
        // Utilizador fez logout ou não está logado
        delete apiClient.defaults.headers.common['Authorization'];
        setUser(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Função de Login com Google
  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      toast.error("Erro ao conectar com Google.");
    }
  };

  // Função de Logout
  const signOut = async () => {
    await firebaseSignOut(auth);
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    signInGoogle, // Nome consistente com LoginPage
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}