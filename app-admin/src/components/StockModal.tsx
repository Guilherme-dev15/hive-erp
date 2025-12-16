import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpCircle, ArrowDownCircle, AlertTriangle, History, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adjustStock, getProductLogs } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

export function StockModal({ isOpen, onClose, product, onSuccess }: StockModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'adjust' | 'history'>('adjust');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [type, setType] = useState<'entry' | 'exit' | 'loss'>('entry');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  // Carregar Histórico
  useEffect(() => {
    if (isOpen && product?.id) {
      loadHistory();
      // Reset form
      setType('entry');
      setQuantity('');
      setReason('');
      setActiveTab('adjust');
    }
  }, [isOpen, product]);

  const loadHistory = async () => {
    setLoadingLogs(true);
    try {
      const data = await getProductLogs(product.id);
      setLogs(data);
    } catch (e) { console.error(e); }
    finally { setLoadingLogs(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) return toast.error("Quantidade inválida");

    setSubmitting(true);
    try {
      await adjustStock({
        productId: product.id,
        type,
        quantity: Number(quantity),
        reason,
        userName: user?.displayName || user?.email || 'Admin'
      });
      toast.success("Estoque atualizado!");
      onSuccess(); // Atualiza a lista pai
      onClose();   // Fecha modal
    } catch (e) {
      toast.error("Erro ao atualizar estoque");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Gerenciar Estoque</h2>
            <p className="text-sm text-gray-500">{product.name} (Atual: <strong className="text-gray-900">{product.quantity}</strong>)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20}/></button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 p-4 text-sm font-bold transition-colors ${activeTab === 'adjust' ? 'text-dourado border-b-2 border-dourado bg-yellow-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Novo Ajuste
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 p-4 text-sm font-bold transition-colors ${activeTab === 'history' ? 'text-dourado border-b-2 border-dourado bg-yellow-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Histórico de Movimentações
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'adjust' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SELETOR DE TIPO */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  type="button"
                  onClick={() => setType('entry')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'entry' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}
                >
                  <ArrowUpCircle size={24} />
                  <span className="font-bold text-sm">Entrada</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setType('exit')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'exit' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}
                >
                  <ArrowDownCircle size={24} />
                  <span className="font-bold text-sm">Saída</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setType('loss')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'loss' ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}
                >
                  <AlertTriangle size={24} />
                  <span className="font-bold text-sm">Perda/Quebra</span>
                </button>
              </div>

              {/* INPUTS */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantidade</label>
                  <input 
                    type="number" min="1" required
                    value={quantity} onChange={e => setQuantity(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-dourado"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo / Observação</label>
                  <input 
                    type="text" required
                    value={reason} onChange={e => setReason(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-dourado"
                    placeholder={type === 'entry' ? "Ex: Reposição de fornecedor" : "Ex: Venda balcão ou Defeito"}
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={submitting}
                className="w-full py-4 bg-carvao text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                Confirmar Movimentação
              </button>
            </form>
          ) : (
            // HISTÓRICO
            <div className="space-y-4">
              {loadingLogs ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400"/></div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Nenhum histórico encontrado.</div>
              ) : (
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          log.type === 'entry' ? 'bg-green-100 text-green-600' : 
                          log.type === 'loss' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {log.type === 'entry' ? <ArrowUpCircle size={16}/> : 
                           log.type === 'loss' ? <AlertTriangle size={16}/> : <ArrowDownCircle size={16}/>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{log.reason}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleDateString()} às {new Date(log.createdAt).toLocaleTimeString().slice(0,5)} • por {log.user.split('@')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${log.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {log.change > 0 ? '+' : ''}{log.change}
                        </p>
                        <p className="text-[10px] text-gray-400">Saldo: {log.newQuantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}