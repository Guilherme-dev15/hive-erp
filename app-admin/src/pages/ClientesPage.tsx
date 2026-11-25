import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Edit2,
  Trash2,
  ChevronRight,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { getCustomers, deleteCustomer } from '../services/apiService';
import { Customer } from '../types';
import { ClienteFormModal } from '../components/ClienteFormModal';
import { ImportClientesModal } from '../components/ImportClientesModal';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

export function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      toast.error('Erro ao listar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.document && c.document.includes(q))
      );
    });
  }, [customers, search]);

  const stats = useMemo(() => {
    const total = customers.length;
    const comCompras = customers.filter((c) => (c.ordersCount || 0) > 0).length;
    const totalReceita = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
    return { total, comCompras, totalReceita };
  }, [customers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o cliente ${name}?`)) return;
    try {
      await deleteCustomer(id);
      toast.success('Cliente removido!');
      carregarClientes();
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
    } catch (err) {
      console.error('Erro ao deletar cliente:', err);
      toast.error('Erro ao deletar cliente.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER & AÇÕES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="text-amber-500" size={32} />
            Clientes & CRM
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Histórico completo de compras, contatos e propostas
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            Importar Planilha
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-carvao hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-md transition-all"
          >
            <Plus size={18} />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO (CRM STATS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Total de Clientes
          </p>
          <h3 className="text-2xl font-black text-gray-900">{stats.total}</h3>
          <p className="text-xs text-gray-400 mt-1">Base cadastrada no ERP</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Clientes Recorrentes
          </p>
          <h3 className="text-2xl font-black text-emerald-600">{stats.comCompras}</h3>
          <p className="text-xs text-gray-400 mt-1">Já realizaram pedidos</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Volume de Vendas (LTV)
          </p>
          <h3 className="text-2xl font-black text-indigo-600">
            {formatCurrency(stats.totalReceita)}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Faturamento gerado pela base</p>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, telefone/whatsapp, e-mail ou CPF/CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
        />
      </div>

      {/* GRID PRINCIPAL: LISTA E DETALHES CRM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA DE CLIENTES */}
        <div className={`lg:col-span-2 space-y-3 ${selectedCustomer ? 'hidden sm:block' : ''}`}>
          {loading ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-2xl border border-gray-100">
              Carregando clientes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-2xl border border-gray-100">
              Nenhum cliente encontrado.
            </div>
          ) : (
            filtered.map((cli) => {
              const isSelected = selectedCustomer?.id === cli.id;
              const cleanPhone = cli.phone?.replace(/\D/g, '') || '';
              return (
                <div
                  key={cli.id}
                  onClick={() => setSelectedCustomer(cli)}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between hover:shadow-md ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-700 font-bold rounded-2xl flex items-center justify-center text-lg flex-shrink-0">
                      {cli.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{cli.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                        {cli.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} /> {cli.phone}
                          </span>
                        )}
                        {cli.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={12} /> {cli.email}
                          </span>
                        )}
                        {cli.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {cli.city}/{cli.state}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        {cli.ordersCount || 0} pedidos
                      </p>
                      <p className="font-black text-gray-800 text-sm">
                        {formatCurrency(cli.totalSpent || 0)}
                      </p>
                    </div>

                    {cleanPhone && (
                      <a
                        href={`https://wa.me/55${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="Conversar no WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </a>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCustomer(cli);
                        setIsFormOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cli.id, cli.name);
                      }}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>

                    <ChevronRight size={18} className="text-gray-300" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DETALHES DO CLIENTE SELECIONADO (HISTÓRICO CRM) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          {selectedCustomer ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedCustomer.document ? `Doc: ${selectedCustomer.document}` : 'Sem documento'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCustomer(selectedCustomer);
                    setIsFormOpen(true);
                  }}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all"
                >
                  Editar
                </button>
              </div>

              {/* Informações de contato */}
              <div className="space-y-2.5 text-xs text-gray-600 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-amber-600" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-amber-600" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-amber-600" />
                    <span>
                      {selectedCustomer.address}
                      {selectedCustomer.city ? ` - ${selectedCustomer.city}/${selectedCustomer.state}` : ''}
                    </span>
                  </div>
                )}
                {selectedCustomer.notes && (
                  <div className="pt-2 border-t border-gray-200 text-gray-500 italic">
                    "{selectedCustomer.notes}"
                  </div>
                )}
              </div>

              {/* Histórico de Compras */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                  <ShoppingBag size={14} /> Histórico de Compras & Propostas
                </h4>

                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {selectedCustomer.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-white rounded-xl border border-gray-100 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-gray-800">
                            #{ord.id.slice(0, 6).toUpperCase()}
                          </p>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock size={10} />
                            {new Date(ord.createdAt as string).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'Concluído'
                                ? 'bg-emerald-50 text-emerald-700'
                                : ord.status === 'Orçamento'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {ord.status}
                          </span>
                          <p className="font-black text-gray-900 mt-1">
                            {formatCurrency(ord.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl text-center">
                    Nenhuma compra ou orçamento registrado ainda.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 min-h-[300px]">
              <Users size={48} className="text-gray-200 mb-2" />
              <p className="text-sm font-semibold text-gray-600">Nenhum cliente selecionado</p>
              <p className="text-xs mt-1">Clique em um cliente da lista para ver o histórico e CRM completo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <ClienteFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        cliente={editingCustomer}
        onSuccess={carregarClientes}
      />

      <ImportClientesModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={carregarClientes}
      />
    </div>
  );
}
