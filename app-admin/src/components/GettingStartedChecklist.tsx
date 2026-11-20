import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getAdminProdutos,
  getCategories,
  getConfig,
} from '../services/apiService';
import { getCatalogUrl } from '../utils/catalogUrl';
import type { Pagina } from './Sidebar';

interface GettingStartedChecklistProps {
  storeSlug?: string | null;
  activeProductsCount?: number;
  onNavigate?: (pagina: Pagina) => void;
}

function safeGetStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignora falhas de storage em ambientes restritos
  }
}

export function GettingStartedChecklist({
  storeSlug,
  activeProductsCount = 0,
  onNavigate,
}: GettingStartedChecklistProps) {
  const storageSuffix = (storeSlug || 'default').trim().toLowerCase() || 'default';
  const dismissedKey = `hive_checklist_dismissed_${storageSuffix}`;
  const visitedKey = `hive_checklist_catalog_visited_${storageSuffix}`;

  const [dismissed, setDismissed] = useState<boolean>(
    () => safeGetStorage(dismissedKey) === 'true',
  );
  const [catalogVisited, setCatalogVisited] = useState<boolean>(
    () => safeGetStorage(visitedKey) === 'true',
  );
  const [loading, setLoading] = useState(true);
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasCategories, setHasCategories] = useState(false);
  const [hasProducts, setHasProducts] = useState(activeProductsCount > 0);
  const [resolvedSlug, setResolvedSlug] = useState<string | null | undefined>(storeSlug);

  useEffect(() => {
    setHasProducts((prev) => prev || activeProductsCount > 0);
  }, [activeProductsCount]);

  useEffect(() => {
    if (dismissed) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadChecklistState() {
      try {
        const [configResult, categoriesResult, productsResult] = await Promise.allSettled([
          typeof getConfig === 'function' ? getConfig() : Promise.resolve(null),
          typeof getCategories === 'function' ? getCategories() : Promise.resolve([]),
          typeof getAdminProdutos === 'function' ? getAdminProdutos() : Promise.resolve([]),
        ]);

        if (cancelled) return;

        if (configResult.status === 'fulfilled' && configResult.value) {
          const digits = String(configResult.value.whatsappNumber || '').replace(/\D/g, '');
          setHasWhatsapp(digits.length >= 10);
          if (configResult.value.slug) {
            setResolvedSlug(configResult.value.slug);
          }
        }

        if (categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value)) {
          setHasCategories(categoriesResult.value.length > 0);
        }

        if (productsResult.status === 'fulfilled' && Array.isArray(productsResult.value)) {
          setHasProducts(productsResult.value.length > 0 || activeProductsCount > 0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadChecklistState();

    return () => {
      cancelled = true;
    };
  }, [dismissed, activeProductsCount]);

  if (dismissed || loading) {
    return null;
  }

  const catalogUrl = getCatalogUrl(resolvedSlug ?? storeSlug);

  const steps = [
    {
      id: 'whatsapp',
      title: 'Configurar WhatsApp da Loja',
      description: 'Defina o número para receber pedidos da vitrine direto no WhatsApp.',
      done: hasWhatsapp,
      actionLabel: 'Configurar WhatsApp',
      onAction: () => onNavigate?.('configuracoes'),
    },
    {
      id: 'category',
      title: 'Criar Primeira Categoria',
      description: 'Organize sua vitrine por categorias para facilitar a busca dos clientes.',
      done: hasCategories,
      actionLabel: 'Ir para Categorias',
      onAction: () => onNavigate?.('categorias'),
    },
    {
      id: 'product',
      title: 'Cadastrar Primeiro Produto',
      description: 'Adicione um item com preço de venda e estoque para ativar o catálogo.',
      done: hasProducts,
      actionLabel: 'Cadastrar Produto',
      onAction: () => onNavigate?.('produtos'),
    },
    {
      id: 'catalog',
      title: 'Conferir Vitrine Online',
      description: 'Abra sua vitrine pública para validar visual, preços e envio no WhatsApp.',
      done: catalogVisited,
      href: catalogUrl,
      actionLabel: 'Abrir Vitrine',
      onVisit: () => {
        safeSetStorage(visitedKey, 'true');
        setCatalogVisited(true);
      },
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  const handleDismiss = () => {
    safeSetStorage(dismissedKey, 'true');
    setDismissed(true);
  };

  return (
    <section
      aria-label="Primeiros Passos"
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-extrabold text-gray-900">
                Primeiros Passos da Loja
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                {completedCount} de {totalCount} concluídos
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {allDone
                ? 'Sua loja está pronta para vender no catálogo e no ERP!'
                : 'Complete os passos essenciais abaixo para deixar sua loja pronta para vender.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Ocultar checklist"
          className="self-end sm:self-auto inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          <X size={14} />
          <span>Ocultar</span>
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            allDone ? 'bg-emerald-500' : 'bg-dourado'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Lista de passos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 transition ${
              step.done
                ? 'bg-emerald-50/50 border-emerald-200/80'
                : 'bg-off-white border-gray-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {step.done ? (
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <h3
                  className={`text-sm font-bold ${
                    step.done ? 'text-emerald-950 line-through decoration-emerald-400' : 'text-gray-900'
                  }`}
                >
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>

            {step.href ? (
              <a
                href={step.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={step.onVisit}
                className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-carvao text-white hover:bg-gray-800 transition"
              >
                <span>{step.actionLabel}</span>
                <ExternalLink size={12} />
              </a>
            ) : (
              !step.done && (
                <button
                  type="button"
                  onClick={step.onAction}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-300 text-carvao hover:bg-gray-50 transition"
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight size={12} />
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
