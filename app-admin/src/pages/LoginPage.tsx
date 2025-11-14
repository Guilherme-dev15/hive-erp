import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Lock } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      toast.success("Bem-vindo de volta!");
    } catch (error) {
      toast.error("Falha no login. Tente novamente.");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100">
        {/* Ícone */}
        <div className="bg-carvao w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Lock className="text-dourado" size={32} />
        </div>

        <h1 className="text-2xl font-bold text-carvao mb-2">Área Restrita</h1>
        <p className="text-gray-500 mb-8">
          Apenas pessoal autorizado da <span className="font-semibold text-dourado">HivePratas</span>.
        </p>

        {/* Botão de Login Google */}
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm group"
        >
          {isLoggingIn ? (
            <Loader2 className="animate-spin text-carvao" size={24} />
          ) : (
            <>
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google G" 
                className="w-6 h-6"
              />
              <span className="font-medium group-hover:text-gray-900">Entrar com Google</span>
            </>
          )}
        </button>

        <p className="mt-8 text-xs text-gray-400">
          Sistema Seguro HiveERP v1.0
        </p>
      </div>
    </div>
  );
}