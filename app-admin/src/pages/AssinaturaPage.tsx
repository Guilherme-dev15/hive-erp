import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Globe,
  Loader2,
  MessageCircle,
  PackagePlus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import {
  cancelProductSetupRequest,
  createBillingCheckoutIntent,
  createProductSetupRequest,
  getBillingStatus,
} from '../services/apiService';
import type {
  BillingStatusResponse,
  CheckoutIntentResponse,
  SetupBatchTier,
  SetupRequestStatus,
} from '../types';
import { getCatalogUrl } from '../utils/catalogUrl';

interface AssinaturaPageProps {
  mode?: 'normal' | 'blocked';
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDateBR(dateValue: string | null | undefined): string {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

const SETUP_STATUS_META: Record<
  SetupRequestStatus,
  { label: string; className: string }
> = {
  PENDING: { label: 'Aguardando Pagamento', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  PAID: { label: 'Pago • Na Fila', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  IN_PROGRESS: { label: 'Em Execução', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  COMPLETED: { label: 'Concluído', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CANCELED: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export function AssinaturaPage({ mode = 'normal' }: AssinaturaPageProps) {
  const { userData, refreshAuth } = useAuth();
  const [statusData, setStatusData] = useState<BillingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingAccess, setRefreshingAccess] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Order Bump & formulário
  const [includeOrderBump, setIncludeOrderBump] = useState(false);
  const [selectedBatchTier, setSelectedBatchTier] = useState<SetupBatchTier>('UP_TO_200');
  const [contactPhone, setContactPhone] = useState('');
  const [sourceDescription, setSourceDescription] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<CheckoutIntentResponse | null>(null);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBillingStatus();
      setStatusData(data);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      toast.error('Não foi possível carregar os dados da assinatura.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const subscription = statusData?.subscription ?? userData?.subscription;
  const catalog = statusData?.catalog;
  const setupBatches = catalog?.setupBatches ?? [];
  const selectedBatch = useMemo(
    () => setupBatches.find((b) => b.tier === selectedBatchTier) ?? setupBatches[0],
    [setupBatches, selectedBatchTier],
  );

  const monthlyPriceCents = catalog?.monthlyPlan.priceCents ?? subscription?.monthlyPriceCents ?? 9700;
  const orderBumpPriceCents = includeOrderBump && selectedBatch ? selectedBatch.priceCents : 0;
  const combinedTotalCents = monthlyPriceCents + orderBumpPriceCents;

  const catalogUrl = getCatalogUrl(userData?.store?.slug);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error('Não foi possível copiar automaticamente.');
    }
  };

  const handleCheckoutMonthly = async () => {
    setSubmitting(true);
    try {
      const result = await createBillingCheckoutIntent({
        setupBatchTier: includeOrderBump ? selectedBatchTier : undefined,
        contactPhone: contactPhone.trim() || undefined,
        sourceDescription: sourceDescription.trim() || undefined,
      });
      setCheckoutResult(result);
      toast.success('Solicitação gerada! Conclua o Pix e envie no WhatsApp.');
      await loadBilling();
    } catch (error) {
      console.error('Erro ao gerar cobrança:', error);
      toast.error('Erro ao gerar solicitação de assinatura.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStandaloneSetup = async () => {
    if (!selectedBatch) return;
    setSubmitting(true);
    try {
      const created = await createProductSetupRequest({
        batchTier: selectedBatch.tier,
        includeMonthlyPlan: false,
        contactPhone: contactPhone.trim() || undefined,
        sourceDescription: sourceDescription.trim() || undefined,
      });
      setCheckoutResult({
        referenceCode: created.referenceCode,
        monthlyPlanPriceCents: 0,
        setupBatchTier: created.batchTier,
        setupBatchMaxProducts: created.maxProducts,
        setupPriceCents: created.priceCents,
        totalPriceCents: created.totalPriceCents,
        pix: created.pix,
        supportWhatsapp: catalog?.supportWhatsapp ?? null,
        whatsappMessage: created.whatsappMessage ?? '',
        whatsappUrl: created.whatsappUrl,
        setupRequestId: created.id,
      });
      toast.success(`Pedido de setup (${selectedBatch.maxProducts} produtos) registrado!`);
      await loadBilling();
    } catch (error) {
      console.error('Erro ao solicitar setup:', error);
      toast.error('Erro ao registrar solicitação de setup.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSetup = async (id: string) => {
    setCancelingId(id);
    try {
      await cancelProductSetupRequest(id);
      toast.success('Solicitação cancelada.');
      await loadBilling();
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error);
      toast.error('Não foi possível cancelar a solicitação.');
    } finally {
      setCancelingId(null);
    }
  };

  const handleVerifyActivation = async () => {
    setRefreshingAccess(true);
    try {
      if (typeof refreshAuth === 'function') {
        await refreshAuth();
      }
      await loadBilling();
      toast.success('Status da assinatura atualizado!');
    } catch {
      toast.error('Erro ao verificar liberação.');
    } finally {
      setRefreshingAccess(false);
    }
  };

  if (loading && !statusData) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-carvao" size={36} />
      </div>
    );
  }

  const isBlocked = mode === 'blocked' || Boolean(subscription?.isBlocked && !userData?.isSuperAdmin);
  const effectiveStatus = subscription?.effectiveStatus ?? 'TRIAL';

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {isBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={22} />
            <div>
              <h2 className="text-base font-bold text-red-900">
                Seu período de acesso ao painel expirou
              </h2>
              <p className="text-sm text-red-800 mt-0.5">
                O acesso administrativo foi pausado até a renovação do plano. Sua vitrine pública continua online normalmente para seus clientes.
              </p>
            </div>
          </div>
          {catalogUrl && (
            <a
              href={catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-red-200 text-xs font-bold text-red-900 hover:bg-red-100 transition flex-shrink-0"
            >
              <Globe size={14} />
              <span>Abrir Vitrine Pública</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {/* Card Status Atual */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Assinatura Atual
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                subscription?.isExempt
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : effectiveStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : effectiveStatus === 'TRIAL'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {subscription?.isExempt
                ? 'Ativa (Isenta / Plataforma)'
                : effectiveStatus === 'ACTIVE'
                  ? 'Plano Ativo'
                  : effectiveStatus === 'TRIAL'
                    ? `Trial (${subscription?.daysRemaining ?? 0} dia(s) restante(s))`
                    : effectiveStatus === 'CANCELED'
                      ? 'Cancelada'
                      : 'Expirada'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {catalog?.monthlyPlan.name ?? 'Plano Mensal HiveERP'}
          </h3>
          <p className="text-sm text-gray-600">
            {effectiveStatus === 'TRIAL'
              ? `Teste grátis até ${formatDateBR(subscription?.trialEndsAt)}.`
              : effectiveStatus === 'ACTIVE' && subscription?.currentPeriodEnd
                ? `Ciclo ativo até ${formatDateBR(subscription.currentPeriodEnd)}.`
                : 'Ative ou renove seu acesso via Pix assistido para liberar imediatamente o painel.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleVerifyActivation}
          disabled={refreshingAccess}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-800 transition disabled:opacity-60"
        >
          {refreshingAccess ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          <span>Já paguei, verificar liberação</span>
        </button>
      </div>

      {/* Plano Único + Order Bump de Setup por Lote */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full mb-2">
                <Sparkles size={13} /> Plano Único Sem Limite de Produtos
              </span>
              <h2 className="text-2xl font-bold text-gray-900">
                {catalog?.monthlyPlan.name ?? 'Plano Mensal HiveERP'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {catalog?.monthlyPlan.description}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-extrabold text-carvao">
                {formatBRL(monthlyPriceCents)}
              </div>
              <div className="text-xs text-gray-500">por mês</div>
            </div>
          </div>

          {/* Order Bump Card */}
          <div
            className={`rounded-2xl border-2 p-5 transition ${
              includeOrderBump
                ? 'border-dourado bg-amber-50/40'
                : 'border-dashed border-gray-300 bg-gray-50/50'
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOrderBump}
                onChange={(e) => setIncludeOrderBump(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-carvao focus:ring-dourado"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-gray-900 flex items-center gap-2">
                    <PackagePlus size={18} className="text-amber-700" />
                    Order Bump: Quer que nossa equipe cadastre seus produtos?
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                    Serviço Único por Lote
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Economize dias de trabalho: envie sua planilha ou catálogo do fornecedor e nós subimos seus produtos prontos para vender. Você continua podendo cadastrar quantos SKUs quiser manualmente.
                </p>
              </div>
            </label>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {setupBatches.map((batch) => {
                const isSelected = selectedBatchTier === batch.tier;
                return (
                  <button
                    key={batch.tier}
                    type="button"
                    onClick={() => {
                      setSelectedBatchTier(batch.tier);
                      setIncludeOrderBump(true);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-carvao bg-white shadow-sm ring-2 ring-dourado/40'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-500 uppercase">
                      Até {batch.maxProducts} produtos
                    </div>
                    <div className="text-base font-extrabold text-gray-900 mt-1">
                      {formatBRL(batch.priceCents)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dados de contato opcional para acelerar implantação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                WhatsApp para contato (opcional)
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Ex: (11) 99999-8888"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-dourado"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Observação / Origem dos produtos (opcional)
              </label>
              <input
                type="text"
                value={sourceDescription}
                onChange={(e) => setSourceDescription(e.target.value)}
                placeholder="Ex: Planilha Excel / catálogo do fornecedor"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-dourado"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Total da solicitação selecionada</div>
              <div className="text-2xl font-extrabold text-gray-900">
                {formatBRL(combinedTotalCents)}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {!isBlocked && selectedBatch && (
                <button
                  type="button"
                  onClick={handleStandaloneSetup}
                  disabled={submitting}
                  className="px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 transition disabled:opacity-60"
                >
                  Contratar Só Setup ({formatBRL(selectedBatch.priceCents)})
                </button>
              )}

              <button
                type="button"
                onClick={handleCheckoutMonthly}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-carvao hover:bg-gray-800 text-white text-sm font-bold shadow-sm transition disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                <span>
                  {includeOrderBump
                    ? `Assinar Plano + Setup (${formatBRL(combinedTotalCents)})`
                    : `Assinar / Renovar Plano (${formatBRL(monthlyPriceCents)})`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Painel Pix & WhatsApp Assistido */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={20} />
            <h3 className="font-bold text-gray-900">Pagamento via Pix Assistido</h3>
          </div>

          {checkoutResult ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Solicitação registrada
                </div>
                <div>
                  Código: <strong className="font-mono">{checkoutResult.referenceCode}</strong>
                </div>
                <div>
                  Valor: <strong>{formatBRL(checkoutResult.totalPriceCents)}</strong>
                </div>
              </div>

              {checkoutResult.pix.configured && checkoutResult.pix.key ? (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase">
                    Chave Pix ({checkoutResult.pix.keyType || 'Chave'})
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                    <span className="text-xs font-mono text-gray-800 truncate">
                      {checkoutResult.pix.key}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(checkoutResult.pix.key!, 'Chave Pix')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
                    >
                      <Copy size={12} /> Copiar
                    </button>
                  </div>
                  {checkoutResult.pix.beneficiary && (
                    <p className="text-xs text-gray-600">
                      Favorecido: <strong>{checkoutResult.pix.beneficiary}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  Envie o resumo pelo WhatsApp abaixo para receber a chave Pix atualizada e ativar seu acesso.
                </div>
              )}

              <div className="space-y-2">
                {checkoutResult.whatsappUrl && (
                  <a
                    href={checkoutResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                  >
                    <MessageCircle size={16} />
                    <span>Enviar Comprovante no WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleCopy(checkoutResult.whatsappMessage, 'Resumo da solicitação')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 transition"
                >
                  <Copy size={14} />
                  <span>Copiar Resumo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                1. Escolha renovar o plano mensal (e marque o <strong>Order Bump de Setup</strong> se desejar que nossa equipe cadastre seu catálogo).
              </p>
              <p>
                2. Clique em gerar solicitação para receber o código de referência e os dados Pix/WhatsApp.
              </p>
              <p>
                3. Após a confirmação, clique em <strong>“Já paguei, verificar liberação”</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Solicitações de Setup */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900">
          Minhas Solicitações de Setup de Produtos
        </h3>

        {!statusData?.setupRequests.length ? (
          <p className="text-sm text-gray-500">
            Nenhuma solicitação de cadastro em lote registrada até o momento.
          </p>
        ) : (
          <div className="space-y-3">
            {statusData.setupRequests.map((req) => {
              const meta = SETUP_STATUS_META[req.status];
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-700">
                        {req.referenceCode}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.className}`}>
                        {meta.label}
                      </span>
                      {req.includeMonthlyPlan && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          + Plano Mensal
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Setup até {req.maxProducts} produtos • Total: {formatBRL(req.totalPriceCents)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Criado em {formatDateBR(req.createdAt)}
                      {req.importedCount !== null && ` • ${req.importedCount} produto(s) importado(s)`}
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleCancelSetup(req.id)}
                      disabled={cancelingId === req.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition self-start sm:self-auto"
                    >
                      {cancelingId === req.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
