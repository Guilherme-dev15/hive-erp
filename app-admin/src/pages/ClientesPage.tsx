import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  MessageCircle,
  ExternalLink,
  Calendar,
  ChevronRight,
  X,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCustomers } from '../services/apiService';
import type { CustomerSummary, CustomersListResponse } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getContrastColor } from '../utils/themeUtils';

export function ClientesPage() {
  const { theme } = useTheme();
  const primaryColor = theme.primaryColor || '#D4AF37';
  const contrastOnPrimary = getContrastColor(primaryColor);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomersListResponse>({
    data: [],
    total: 0,
    totalRevenue: 0,
    averageTicketGlobal: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalSpent' | 'totalOrders' | 'lastOrderDate' | 'name'>('totalSpent');

  // Modal / Drawer de Detalhes do Cliente
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  useEffect(() => {
    carregarClientes();
  }, [sortBy]);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const res = await getCustomers({
        search: searchTerm,
        sortBy,
        sortOrder: 'desc',
      });
      setData(res);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar carteira de clientes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    carregarClientes();
  };

  // Contagem de clientes com mais de 1 compra
  const recurringCount = useMemo(() => {
    return data.data.filter((c) => c.totalOrders > 1).length;
  }, [data.data]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDate = (dateInput: string | Date) => {
    try {
      const d = new Date(dateInput);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    } catch {
      return '-';
    }
  };

  const formatPhone = (phone: string, cleanPhone: string) => {
    if (!cleanPhone || cleanPhone.length < 10) return phone || 'Sem telefone';
    if (cleanPhone.length === 11) {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
    }
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  };

  const openWhatsApp = (customer: CustomerSummary) => {
    if (!customer.cleanPhone) {
      toast.error('Este cliente não possui número de telefone cadastrado.');
      return;
    }
    const msg = encodeURIComponent(
      `Olá ${customer.name}! Tudo bem? Sou da ${theme.storeName || 'loja'} e estou entrando em contato para saber como foi sua experiência conosco!`
    );
    window.open(`https://wa.me/55${customer.cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total de Clientes
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {data.total}
            </h3>
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Users size={22} style={{ color: primaryColor }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              LTV Acumulado
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {formatCurrency(data.totalRevenue)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Ticket Médio Geral
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {formatCurrency(data.averageTicketGlobal)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Clientes Recorrentes
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {recurringCount}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-300 transition-all text-gray-800"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap hidden sm:inline">
            Ordenar por:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-pointer"
          >
            <option value="totalSpent">Maior Faturamento (LTV)</option>
            <option value="totalOrders">Mais Pedidos Feitos</option>
            <option value="lastOrderDate">Última Compra (Recente)</option>
            <option value="name">Nome do Cliente (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Lista / Grid de Clientes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin text-carvao" size={36} />
          <p className="text-sm font-medium mt-3">Carregando carteira de clientes...</p>
        </div>
      ) : data.data.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto text-gray-400 mb-4">
            <Users size={28} />
          </div>
          <h4 className="text-base font-bold text-gray-900">
            {searchTerm
              ? 'Nenhum cliente corresponde à busca'
              : 'Nenhum cliente registrado ainda'}
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            {searchTerm
              ? 'Verifique a digitação do nome ou telefone e tente novamente.'
              : 'Conforme seus clientes realizarem compras pelo catálogo ou balcão, eles serão consolidados automaticamente aqui com histórico completo de LTV.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((customer) => {
            const isRecurring = customer.totalOrders > 1;

            return (
              <motion.div
                key={customer.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-sm"
                        style={{
                          backgroundColor: `${primaryColor}20`,
                          color: primaryColor,
                        }}
                      >
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-gray-900 truncate">
                          {customer.name}
                        </h4>
                        <p className="text-xs font-semibold text-gray-500 mt-0.5">
                          {formatPhone(customer.phone, customer.cleanPhone)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                        isRecurring
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isRecurring ? 'Recorrente' : 'Novo'}
                    </span>
                  </div>

                  {/* Métricas do Cliente */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl my-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Total Gasto (LTV)
                      </span>
                      <p className="font-extrabold text-gray-900 mt-0.5">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Pedidos
                      </span>
                      <p className="font-extrabold text-gray-900 mt-0.5">
                        {customer.totalOrders} {customer.totalOrders === 1 ? 'pedido' : 'pedidos'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Ticket Médio
                      </span>
                      <p className="font-semibold text-gray-700 mt-0.5">
                        {formatCurrency(customer.averageTicket)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Última Compra
                      </span>
                      <p className="font-semibold text-gray-700 mt-0.5">
                        {formatDate(customer.lastOrderDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition py-1"
                  >
                    <span>Ver Pedidos</span>
                    <ChevronRight size={14} />
                  </button>

                  {customer.cleanPhone && (
                    <button
                      onClick={() => openWhatsApp(customer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl transition"
                      title="Enviar mensagem no WhatsApp"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Histórico de Pedidos do Cliente */}
      <AnimatePresence>
        {selectedCustomer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {formatPhone(selectedCustomer.phone, selectedCustomer.cleanPhone)} · {selectedCustomer.totalOrders} pedidos realizados
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
                <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      LTV Total
                    </span>
                    <p className="text-base font-black text-gray-900">
                      {formatCurrency(selectedCustomer.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Ticket Médio
                    </span>
                    <p className="text-base font-black text-gray-900">
                      {formatCurrency(selectedCustomer.averageTicket)}
                    </p>
                  </div>
                  {selectedCustomer.cleanPhone && (
                    <button
                      onClick={() => openWhatsApp(selectedCustomer)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition"
                    >
                      <MessageCircle size={14} />
                      <span>Conversar</span>
                    </button>
                  )}
                </div>

                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider pt-2">
                  Histórico de Pedidos
                </h4>

                <div className="space-y-2">
                  {selectedCustomer.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-2xs hover:border-gray-200 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                          <ShoppingBag size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-gray-900">
                            {formatCurrency(ord.total)}
                          </p>
                          <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-gray-400" />
                            {formatDate(ord.createdAt)} · {ord.itemsCount} itens
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                        {ord.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
