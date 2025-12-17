import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Shield, ShieldCheck, Mail, Lock } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const db = getFirestore();

export function EquipePage() {
  const { user, userData } = useAuth(); // userData tem o 'role' (owner/vendedor)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verifica se quem está logado é o DONO
  const isOwner = userData?.role === 'owner';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const lista = querySnapshot.docs.map(d => ({ email: d.id, ...d.data() }));
      setUsersList(lista);
    } catch (error) {
      toast.error("Erro ao carregar equipe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return toast.error("Apenas o dono pode adicionar membros."); // Bloqueio lógico
    if (!newEmail || !newName) return;

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "users", newEmail.trim().toLowerCase()), {
        name: newName,
        email: newEmail.trim().toLowerCase(),
        role: 'vendedor',
        active: true,
        createdBy: user?.email,
        createdAt: new Date()
      });
      
      toast.success("Usuário adicionado!");
      setNewEmail('');
      setNewName('');
      loadUsers();
    } catch (error) {
      toast.error("Erro ao adicionar usuário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (targetUser: any) => {
    if (!isOwner) return toast.error("Apenas o dono pode remover membros.");
    
    // Ninguém pode deletar um OWNER (nem mesmo outro owner, por segurança básica nesta versão)
    if (targetUser.role === 'owner') {
      return toast.error("O Dono não pode ser removido.");
    }

    if (!confirm(`Revogar acesso de ${targetUser.name}?`)) return;

    try {
      await deleteDoc(doc(db, "users", targetUser.email));
      toast.success("Acesso revogado.");
      loadUsers();
    } catch (error) {
      toast.error("Erro ao remover.");
    }
  };

  return (
    <div className="pb-20 max-w-4xl mx-auto">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="text-dourado" /> Gestão de Equipe
        </h1>
        <p className="text-gray-500 mt-2">
          {isOwner 
            ? "Gerencie quem tem acesso ao sistema." 
            : "Visualize a equipe da loja."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* FORMULÁRIO (SÓ APARECE PARA O DONO) */}
        {isOwner ? (
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-green-600"/> Novo Membro
              </h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                  <input 
                    value={newName} onChange={e => setNewName(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-dourado"
                    placeholder="Ex: João Silva" required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">E-mail Google</label>
                  <input 
                    type="email"
                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-dourado"
                    placeholder="joao@gmail.com" required
                  />
                </div>
                
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full py-3 bg-carvao text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  Confirmar Acesso
                </button>
              </form>
            </div>
          </div>
        ) : (
          // SE NÃO FOR DONO, MOSTRA UM AVISO
          <div className="md:col-span-1">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center opacity-75">
              <Lock size={32} className="mx-auto text-gray-400 mb-2"/>
              <h3 className="font-bold text-gray-600">Acesso Restrito</h3>
              <p className="text-sm text-gray-500 mt-1">Apenas o Admin Master pode adicionar ou remover membros.</p>
            </div>
          </div>
        )}

        {/* LISTA */}
        <div className="md:col-span-2 space-y-4">
          {loading ? <p>Carregando...</p> : usersList.map((u) => (
            <motion.div 
              key={u.email} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${u.role === 'owner' ? 'bg-yellow-50/50 border-yellow-100' : 'bg-white border-gray-100'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${u.role === 'owner' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-50 text-blue-600'}`}>
                  {u.role === 'owner' ? <ShieldCheck size={20} /> : <Shield size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{u.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail size={12} /> {u.email}
                  </div>
                </div>
              </div>

              {/* BOTÃO DE DELETE: Só aparece se EU for Owner E o alvo NÃO for Owner */}
              {isOwner && u.role !== 'owner' && (
                <button 
                  onClick={() => handleDelete(u)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Revogar Acesso"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}