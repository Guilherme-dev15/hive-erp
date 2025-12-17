import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // NOVOS IMPORTS
import { auth } from '../firebaseConfig'; 
import { toast } from 'react-hot-toast';
import { apiClient } from '../services/apiService'; // Importante para o Backend

interface AuthContextType {
  user: User | null;
  userData: any | null; // Dados extras (cargo, ativo/inativo)
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Inicializa o Firestore
const db = getFirestore();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      
      // --- LÓGICA DO "GATEKEEPER" DINÂMICO ---
      if (currentUser && currentUser.email) {
        try {
          // 1. Buscamos o usuário no Firestore usando o email como ID
          const userRef = doc(db, "users", currentUser.email);
          const userSnap = await getDoc(userRef);

          // 2. Verificamos se existe e se está ativo
          if (userSnap.exists() && userSnap.data().active === true) {
            
            // APROVADO:
            const data = userSnap.data();
            setUserData(data);
            setUser(currentUser);

            // 3. PEGAR O TOKEN E INJETAR NO AXIOS (CRUCIAL PARA O BACKEND)
            const token = await currentUser.getIdToken();
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          } else {
            // REPROVADO (Não cadastrado ou inativo)
            toast.error("Acesso negado. Usuário não cadastrado na equipe.");
            await firebaseSignOut(auth);
            
            // Limpa tudo
            setUser(null);
            setUserData(null);
            delete apiClient.defaults.headers.common['Authorization'];
          }

        } catch (error) {
          console.error("Erro ao validar usuário:", error);
          toast.error("Erro de conexão ao validar permissões.");
          setUser(null);
        }
      } else {
        // Logout ou não logado
        setUser(null);
        setUserData(null);
        delete apiClient.defaults.headers.common['Authorization'];
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Função de Login
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Erro login:", error);
        toast.error("Erro ao conectar com Google.");
      }
    }
  };

  // Função de Logout
  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    userData,
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