import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  ShieldCheck,
  Mail,
  Lock,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { getTeamMembers } from '../services/apiService';

interface TeamMember {
    email: string;
    name: string;
    role: 'admin' | 'owner' | 'vendedor' | 'OWNER' | 'SELLER';
    active: boolean;
}

export function EquipePage() {
  const { userData } = useAuth();
  const [usersList, setUsersList] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedRole = String(userData?.role ?? '').toLowerCase();
  const isOwner = normalizedRole === 'admin' || normalizedRole === 'owner';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const lista = await getTeamMembers();
      setUsersList(lista);
    } catch {
      toast.error('Erro ao carregar equipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="pb-20 max-w-4xl mx-auto">
      <Toaster position="top-right" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="text-dourado" /> Gestão de Equipe
        </h1>
        <p className="text-gray-500 mt-2">
          {isOwner
            ? 'Gerencie quem tem acesso ao sistema.'
            : 'Visualize a equipe da loja.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {isOwner ? (
          <div className="md:col-span-1">
            <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200 sticky top-6 space-y-2">
              <h2 className="font-bold text-amber-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-700" /> Operação Mono-Usuário Ativa
              </h2>
              <p className="text-sm text-amber-800 leading-relaxed">
                No plano atual, o acesso ao painel é exclusivo do proprietário da loja. O convite de novos colaboradores será liberado na atualização multi-usuário por loja.
              </p>
            </div>
          </div>
        ) : (
          <div className="md:col-span-1">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center opacity-75">
              <Lock size={32} className="mx-auto text-gray-400 mb-2" />
              <h3 className="font-bold text-gray-600">Acesso Restrito</h3>
              <p className="text-sm text-gray-500 mt-1">
                Apenas o Admin Master pode gerenciar membros da loja.
              </p>
            </div>
          </div>
        )}

        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <p>Carregando...</p>
          ) : (
            usersList.map((u) => {
              const memberIsOwner = ['admin', 'owner'].includes(String(u.role).toLowerCase());
              return (
                <motion.div
                  key={u.email}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${memberIsOwner ? 'bg-yellow-50/50 border-yellow-100' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full ${memberIsOwner ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-50 text-blue-600'}`}
                    >
                      {memberIsOwner ? (
                        <ShieldCheck size={20} />
                      ) : (
                        <Shield size={20} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{u.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail size={12} /> {u.email}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

