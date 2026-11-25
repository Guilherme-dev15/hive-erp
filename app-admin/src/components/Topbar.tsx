import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu,
  Globe,
  ExternalLink,
  Search,
  X,
  Package,
  ShoppingBag,
  User,
  DollarSign,
  FileText,
  Settings,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Pagina } from './Sidebar';
import { getCatalogUrl } from '../utils/catalogUrl';
import { getAdminProdutos, getCustomers, getAdminOrders } from '../services/apiService';
import { ProdutoAdmin, Customer, Order } from '../types';
import { formatCurrency } from '../utils/format';

const TITULOS_PAGINA: Record<Pagina, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral e faturamento do seu negócio' },
  pedidos: { title: 'Gestão de Pedidos', subtitle: 'Acompanhe pedidos vindos do catálogo e balcão' },
  clientes: { title: 'Gestão de Clientes', subtitle: 'Carteira de clientes, histórico de compras e LTV' },
  produtos: { title: 'Catálogo de Produtos', subtitle: 'Estoque, custos, preços e variantes' },
  categorias: { title: 'Gestão de Categorias', subtitle: 'Organize os grupos e filtros da sua vitrine online' },
  fornecedores: { title: 'Fornecedores', subtitle: 'Gestão de parceiros e cotações' },
  financeiro: { title: 'Financeiro & Caixa', subtitle: 'Contas, despesas, aportes e fluxo de caixa' },
  campanhas: { title: 'Campanhas Promocionais', subtitle: 'Ajuste global de preços com trava anti-prejuízo' },
  cupons: { title: 'Cupons de Desconto', subtitle: 'Códigos promocionais para fidelização' },
  precificacao: { title: 'Calculadora de Preços', subtitle: 'Simulador de markup e margem de contribuição' },
  relatorios: { title: 'Relatórios & Inteligência', subtitle: 'Curva ABC, histórico de vendas e métricas' },
  equipe: { title: 'Equipe & Acessos', subtitle: 'Controle de colaboradores e permissões' },
  assinatura: { title: 'Assinatura & Setup', subtitle: 'Plano mensal, período de teste e subida assistida de produtos' },
  'super-admin': { title: 'Super Admin SaaS', subtitle: 'Gestão global de lojistas, assinaturas e solicitações de setup' },
  configuracoes: { title: 'Configurações da Loja', subtitle: 'Identidade visual, cores e regras de negócio' },
};

const MODULOS_SISTEMA: Array<{
  id: Pagina;
  nome: string;
  descricao: string;
  keywords: string[];
  icon: typeof ShoppingBag;
}> = [
  {
    id: 'pedidos',
    nome: 'Pedidos & Emissão de NF-e',
    descricao: 'Emitir nota fiscal SEFAZ, orçamentos e vendas balcão',
    keywords: ['nfe', 'nf-e', 'nota fiscal', 'danfe', 'sefaz', 'orçamento', 'venda', 'pedido'],
    icon: FileText,
  },
  {
    id: 'produtos',
    nome: 'Catálogo de Produtos & Estoque',
    descricao: 'Produtos, controle de estoque, importação XML e variantes',
    keywords: ['produto', 'estoque', 'xml', 'nfe import', 'catalogo', 'grade', 'variante'],
    icon: Package,
  },
  {
    id: 'clientes',
    nome: 'Base de Clientes (CRM)',
    descricao: 'Carteira de clientes, histórico de compras e LTV',
    keywords: ['cliente', 'crm', 'contato', 'whatsapp', 'telefone', 'comprador'],
    icon: User,
  },
  {
    id: 'financeiro',
    nome: 'Financeiro & Fluxo de Caixa',
    descricao: 'Contas a pagar/receber, conciliação e DRE',
    keywords: ['financeiro', 'caixa', 'contas', 'pagar', 'receber', 'despesa', 'dre'],
    icon: DollarSign,
  },
  {
    id: 'dashboard',
    nome: 'Dashboard Operacional',
    descricao: 'Visão geral consolidada, gráficos e KPIs',
    keywords: ['dashboard', 'kpi', 'grafico', 'vendas', 'faturamento'],
    icon: ShoppingBag,
  },
  {
    id: 'configuracoes',
    nome: 'Configurações & Dados Fiscais',
    descricao: 'CNPJ emitente, Inscrição Estadual, logotipo e cores',
    keywords: ['configuracao', 'cnpj', 'ie', 'fiscal', 'loja', 'slug', 'cor'],
    icon: Settings,
  },
];

interface TopbarProps {
  paginaAtual: Pagina;
  onOpenMobile: () => void;
  onNavigate?: (pagina: Pagina) => void;
}

export function Topbar({ paginaAtual, onOpenMobile, onNavigate }: TopbarProps) {
  const { theme } = useTheme();
  const info = TITULOS_PAGINA[paginaAtual] || { title: 'Painel', subtitle: '' };
  const catalogUrl = getCatalogUrl(theme.slug);

  // Estados da Barra de Pesquisa Global
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<ProdutoAdmin[]>([]);
  const [matchedCustomers, setMatchedCustomers] = useState<Customer[]>([]);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atalho de teclado global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca debounced através da API quando houver 2 ou mais caracteres
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) {
      setMatchedProducts([]);
      setMatchedCustomers([]);
      setMatchedOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const [prodsRes, custsRes, ordersRes] = await Promise.allSettled([
          getAdminProdutos(),
          getCustomers({ search: term }),
          getAdminOrders(),
        ]);

        if (prodsRes.status === 'fulfilled') {
          const prods = Array.isArray(prodsRes.value) ? prodsRes.value : [];
          setMatchedProducts(
            prods
              .filter(
                (p) =>
                  p.name?.toLowerCase().includes(term) ||
                  p.code?.toLowerCase().includes(term) ||
                  p.description?.toLowerCase().includes(term)
              )
              .slice(0, 4)
          );
        }

        if (custsRes.status === 'fulfilled') {
          const rawCusts = custsRes.value;
          const custs = Array.isArray(rawCusts)
            ? rawCusts
            : Array.isArray((rawCusts as any)?.data)
            ? (rawCusts as any).data
            : [];
          setMatchedCustomers(
            custs
              .filter(
                (c: Customer) =>
                  c.name?.toLowerCase().includes(term) ||
                  c.phone?.includes(term) ||
                  c.email?.toLowerCase().includes(term)
              )
              .slice(0, 4)
          );
        }

        if (ordersRes.status === 'fulfilled') {
          const orders = Array.isArray(ordersRes.value) ? ordersRes.value : [];
          setMatchedOrders(
            orders
              .filter(
                (o) =>
                  o.id?.toLowerCase().includes(term) ||
                  o.customerName?.toLowerCase().includes(term) ||
                  o.nfeKey?.includes(term) ||
                  String(o.nfeNumber || '').includes(term)
              )
              .slice(0, 4)
          );
        }
      } catch (err) {
        console.error('Erro na pesquisa global:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleSelectPage = (target: Pagina) => {
    setIsOpen(false);
    setSearchTerm('');
    onNavigate?.(target);
  };

  const matchedModules = MODULOS_SISTEMA.filter((mod) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      mod.nome.toLowerCase().includes(term) ||
      mod.descricao.toLowerCase().includes(term) ||
      mod.keywords.some((k) => k.includes(term))
    );
  }).slice(0, 5);

  const hasResults =
    matchedModules.length > 0 ||
    matchedProducts.length > 0 ||
    matchedCustomers.length > 0 ||
    matchedOrders.length > 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* TÍTULO E MENU MOBILE */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden focus:outline-none"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-tight">
            {info.title}
          </h2>
          <p className="text-xs text-gray-500 hidden sm:block">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* BARRA DE PESQUISA GLOBAL */}
      <div
        ref={searchContainerRef}
        className="relative flex-1 max-w-lg mx-2 sm:mx-6"
      >
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={16}
          />
          <input
            ref={inputRef}
            type="text"
            role="searchbox"
            placeholder="Buscar produtos, clientes, NF-e, módulos... (Ctrl+K)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-9 pr-16 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-amber-500 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-inner"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-gray-400 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">
                <Command size={10} />K
              </span>
            )}
          </div>
        </div>

        {/* DROPDOWN DE RESULTADOS */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[75vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
            {loading && (
              <div className="p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Pesquisando no ERP...
              </div>
            )}

            {!hasResults && !loading && (
              <div className="p-6 text-center text-xs text-gray-400">
                Nenhum resultado encontrado para &quot;{searchTerm}&quot;.
              </div>
            )}

            {/* MÓDULOS E RECURSOS DO SISTEMA */}
            {matchedModules.length > 0 && (
              <div className="p-2 border-b border-gray-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Navegação & Módulos
                </div>
                {matchedModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleSelectPage(mod.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/70 text-left transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 text-gray-700 group-hover:bg-amber-100 group-hover:text-amber-800 transition">
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-gray-900 group-hover:text-amber-900">
                            {mod.nome}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {mod.descricao}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-amber-600 transition" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* PRODUTOS ENCONTRADOS */}
            {matchedProducts.length > 0 && (
              <div className="p-2 border-b border-gray-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={12} /> Produtos ({matchedProducts.length})
                </div>
                {matchedProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPage('produtos')}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 text-left transition"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-xs text-gray-400 font-bold">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          p.name?.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-gray-800 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {p.code ? `Cód: ${p.code} • ` : ''}Estoque: {p.quantity || 0}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-emerald-600 shrink-0 ml-2">
                      {formatCurrency(p.salePrice)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* CLIENTES ENCONTRADOS */}
            {matchedCustomers.length > 0 && (
              <div className="p-2 border-b border-gray-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} /> Clientes ({matchedCustomers.length})
                </div>
                {matchedCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectPage('clientes')}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 text-left transition"
                  >
                    <div className="truncate">
                      <div className="font-semibold text-xs text-gray-800 truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {c.phone ? `WhatsApp: ${c.phone}` : c.email || 'Cliente cadastrado'}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                      CRM
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* PEDIDOS & NOTAS FISCAIS */}
            {matchedOrders.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} /> Pedidos & Notas Fiscais ({matchedOrders.length})
                </div>
                {matchedOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleSelectPage('pedidos')}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 text-left transition"
                  >
                    <div className="truncate">
                      <div className="font-semibold text-xs text-gray-800 truncate">
                        #{o.id.slice(0, 6).toUpperCase()} • {o.customerName || 'Cliente'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {o.nfeStatus === 'AUTORIZADA' || o.nfeStatus === 'EMITIDA' || o.nfeKey
                          ? `Comprovante Nº ${o.nfeNumber || 1}`
                          : `Status: ${o.status}`}
                      </div>
                    </div>
                    <span className="font-bold text-xs text-gray-900 shrink-0 ml-2">
                      {formatCurrency(o.total)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AÇÕES DA DIREITA */}
      <div className="flex items-center gap-3 shrink-0">
        {catalogUrl && (
          <a
            href={catalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 shadow-sm transition"
          >
            <Globe size={14} style={{ color: theme.primaryColor || '#D4AF37' }} />
            <span className="hidden md:inline">Ver Vitrine</span>
            <ExternalLink size={12} className="text-gray-400" />
          </a>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Loja Conectada</span>
        </div>
      </div>
    </header>
  );
}
