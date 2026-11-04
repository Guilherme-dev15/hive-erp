import React from 'react';
import { Menu, Globe, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Pagina } from './Sidebar';

const TITULOS_PAGINA: Record<Pagina, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral e faturamento do seu negócio' },
  pedidos: { title: 'Gestão de Pedidos', subtitle: 'Acompanhe pedidos vindos do catálogo e balcão' },
  produtos: { title: 'Catálogo de Produtos', subtitle: 'Estoque, custos, preços e variantes' },
  fornecedores: { title: 'Fornecedores', subtitle: 'Gestão de parceiros e cotações' },
  financeiro: { title: 'Financeiro & Caixa', subtitle: 'Contas, despesas, aportes e fluxo de caixa' },
  campanhas: { title: 'Campanhas Promocionais', subtitle: 'Ajuste global de preços com trava anti-prejuízo' },
  cupons: { title: 'Cupons de Desconto', subtitle: 'Códigos promocionais para fidelização' },
  precificacao: { title: 'Calculadora de Preços', subtitle: 'Simulador de markup e margem de contribuição' },
  relatorios: { title: 'Relatórios & Inteligência', subtitle: 'Curva ABC, histórico de vendas e métricas' },
  equipe: { title: 'Equipe & Acessos', subtitle: 'Controle de colaboradores e permissões' },
  configuracoes: { title: 'Configurações da Loja', subtitle: 'Identidade visual, cores e regras de negócio' },
};

interface TopbarProps {
  paginaAtual: Pagina;
  onOpenMobile: () => void;
}

export function Topbar({ paginaAtual, onOpenMobile }: TopbarProps) {
  const { theme } = useTheme();
  const info = TITULOS_PAGINA[paginaAtual] || { title: 'Painel', subtitle: '' };

  const catalogUrl = theme.slug
    ? `https://hiveerp-catalogo.vercel.app/${theme.slug}`
    : null;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
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

      <div className="flex items-center gap-3">
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
