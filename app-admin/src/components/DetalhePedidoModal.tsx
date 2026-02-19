import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Package, Calendar, FileText, Printer, CheckCircle, Truck, Clock, CreditCard, Phone } from 'lucide-react';
import { updateAdminOrderStatus } from '../services/apiService';
import { toast } from 'react-hot-toast';

export function DetalhePedidoModal({ isOpen, onClose, pedido, onUpdate }: any) {
  const [isUpdating, setIsUpdating] = useState(false);
  if (!pedido) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await updateAdminOrderStatus(pedido.id, newStatus);
      toast.success("Status atualizado!");
      if (onUpdate) await onUpdate(); // AQUI ELE ATUALIZA A TELA DE PEDIDOS
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/20 backdrop-blur-sm print:bg-white print:p-0" onClick={onClose}>
          <style>{`
            @media print {
              @page { size: auto; margin: 10mm; }
              body { visibility: hidden; }
              .print-content { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `}</style>

          <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 print-content print:max-h-none print:shadow-none" onClick={e => e.stopPropagation()}>
            
            {/* CABEÇALHO SÓ PARA IMPRESSÃO */}
            <div className="hidden print:block p-4 border-b-2 border-gray-100 mb-4 text-center">
              <h1 className="text-xl font-bold uppercase">Comprovante de Pedido - Hive Pratas</h1>
              <p className="text-indigo-600 font-bold">ID: #{pedido.id.toUpperCase()}</p>
            </div>

            {/* HEADER DA TELA */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Package size={24} /></div>
                <h2 className="text-xl font-bold text-gray-900">Pedido #{pedido.id.toUpperCase()}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 border border-gray-100"><Printer size={20}/></button>
                <button onClick={onClose} className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-rose-500 border border-gray-100"><X size={20}/></button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 print:p-0">
              {/* SELETOR DE STATUS (CLEAN) */}
              <div className="space-y-4 no-print">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Logística: <span className="text-indigo-600 ml-2">{pedido.status}</span></p>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                  {['Em Separação', 'Enviado', 'Concluído'].map(st => (
                    <button key={st} onClick={() => handleStatusChange(st)} disabled={isUpdating} className={`px-5 py-2 rounded-xl text-[11px] font-black border transition-all ${pedido.status === st ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-400 border-gray-200'}`}>{st}</button>
                  ))}
                </div>
              </div>

              {/* DADOS CLIENTE */}
              <div className="grid grid-cols-2 gap-5">
                <div className="p-6 rounded-2xl border border-gray-100 space-y-2">
                  <p className="text-indigo-600 font-bold text-[10px] uppercase">Cliente</p>
                  <p className="font-bold text-gray-900">{pedido.customerName || 'Venda Online'}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2"><Phone size={14}/> {pedido.customerPhone}</p>
                </div>
                <div className="p-6 rounded-2xl border border-gray-100 space-y-2">
                  <p className="text-gray-400 font-bold text-[10px] uppercase">Obs</p>
                  <p className="text-sm text-gray-500 italic">{pedido.notes || "Nenhuma nota."}</p>
                </div>
              </div>

              {/* TABELA ITENS */}
              <table className="w-full text-left border border-gray-100 rounded-2xl overflow-hidden">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black"><tr className="border-b"><th className="p-4">Item</th><th className="p-4 text-center">Qtd</th><th className="p-4 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {pedido.items?.map((item: any, i: number) => (
                    <tr key={i} className="text-sm">
                      <td className="p-4 font-bold text-gray-700">{item.name}</td>
                      <td className="p-4 text-center font-black text-indigo-600">x{item.quantidade}</td>
                      <td className="p-4 text-right font-bold text-gray-900">R$ {(item.salePrice * item.quantidade).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TOTAL */}
              <div className="flex justify-end">
                <div className="w-full md:w-64 p-6 rounded-2xl border-2 border-indigo-600 text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Pago</p>
                  <p className="text-2xl font-black text-indigo-600">R$ {pedido.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}