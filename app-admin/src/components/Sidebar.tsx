import React, { ElementType } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  DollarSign,
  Percent,
  Ticket,
  BarChart3,
  Calculator,
  Settings,
  CreditCard,
  ShieldCheck,
  LogOut,
  Shield,
  X,
  Globe,
  ExternalLink,
  Tags,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { getContrastColor } from '../utils/themeUtils';
import { getCatalogUrl } from '../utils/catalogUrl';

export type Pagina =
  | 'dashboard'
  | 'pedidos'
  | 'clientes'
  | 'produtos'
  | 'categorias'
  | 'fornecedores'
  | 'financeiro'
  | 'campanhas'
  | 'cupons'
  | 'precificacao'
  | 'relatorios'
  | 'equipe'
  | 'assinatura'
  | 'super-admin'
  | 'configuracoes';

interface NavGroup {
  title: string;
  items: {
    id: Pagina;
    label: string;
    icon: ElementType;
  }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Vendas & Operação',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
      { id: 'clientes', label: 'Clientes', icon: UserCheck },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { id: 'produtos', label: 'Produtos', icon: Package },
      { id: 'categorias', label: 'Categorias', icon: Tags },
      { id: 'fornecedores', label: 'Fornecedores', icon: Users },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { id: 'campanhas', label: 'Promoções', icon: Percent },
      { id: 'cupons', label: 'Cupons', icon: Ticket },
    ],
  },
  {
    title: 'Gestão & DRE',
    items: [
      { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
      { id: 'precificacao', label: 'Calc. Preço', icon: Calculator },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { id: 'configuracoes', label: 'Config', icon: Settings },
      { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
    ],
  },
];

const SUPER_ADMIN_GROUP: NavGroup = {
  title: 'Plataforma',
  items: [{ id: 'super-admin', label: 'Super Admin', icon: ShieldCheck }],
};

interface SidebarProps {
  paginaAtual: Pagina;
  onNavigate: (pagina: Pagina) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  paginaAtual,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { user, userData, logout } = useAuth();
  const { theme } = useTheme();

  const primaryColor = theme.primaryColor || '#D4AF37';
  const contrastOnPrimary = getContrastColor(primaryColor);

  const handleItemClick = (id: Pagina) => {
    onNavigate(id);
    onCloseMobile();
  };

  const catalogUrl = getCatalogUrl(theme.slug);
  const visibleGroups = userData?.isSuperAdmin ? [...NAV_GROUPS, SUPER_ADMIN_GROUP] : NAV_GROUPS;

  return (
    <>
      {/* Overlay escuro em telas mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Container Principal da Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-carvao text-gray-200 flex flex-col border-r border-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Topo / Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-gray-800/80">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleItemClick('dashboard')}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105"
              style={{
                backgroundColor: primaryColor,
                color: contrastOnPrimary,
              }}
            >
              {theme.storeName ? theme.storeName.charAt(0).toUpperCase() : 'H'}
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-extrabold tracking-wider uppercase text-white truncate max-w-[130px]">
                HIVE ERP
              </h1>
              <p
                className="text-[11px] font-semibold truncate max-w-[130px]"
                style={{ color: primaryColor }}
              >
                {theme.storeName || 'Minha Loja'}
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Atalho Vitrine Online */}
        {catalogUrl && (
          <div className="px-4 pt-3 pb-1">
            <a
              href={catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/50 transition-all group"
            >
              <div className="flex items-center gap-2 truncate">
                <Globe size={14} style={{ color: primaryColor }} />
                <span className="truncate">Ver Vitrine Online</span>
              </div>
              <ExternalLink size={12} className="text-gray-500 group-hover:text-gray-300" />
            </a>
          </div>
        )}

        {/* Lista de Navegação Agrupada */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 no-scrollbar">
          {visibleGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = paginaAtual === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'shadow-sm font-semibold'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: primaryColor,
                              color: contrastOnPrimary,
                            }
                          : undefined
                      }
                    >
                      <Icon size={16} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé / Perfil do Usuário */}
        <div className="p-3 border-t border-gray-800/80 bg-black/20">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gray-750 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-200 flex-shrink-0">
                {userData?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate max-w-[105px]">
                    {userData?.name || 'Lojista'}
                  </span>
                  {userData?.role === 'admin' && (
                    <span title="Administrador">
                      <Shield size={11} style={{ color: primaryColor }} />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 truncate max-w-[110px]">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Sair da conta"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
