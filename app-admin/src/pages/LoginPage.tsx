import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Chrome } from 'lucide-react';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-off-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-dourado rounded-full flex items-center justify-center text-carvao font-bold text-3xl mb-4">
            H
          </div>
          <h1 className="text-2xl font-bold text-carvao">Bem-vindo ao HIVE ERP</h1>
          <p className="text-gray-600 mt-2">
            Faça login para gerenciar seu negócio.
          </p>
        </div>
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-carvao text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dourado transition-all duration-300"
        >
          <Chrome size={20} />
          Entrar com Google
        </button>
        <p className="text-xs text-gray-400 pt-4">
          Apenas usuários autorizados podem acessar o painel.
        </p>
      </div>
    </div>
  );
}
