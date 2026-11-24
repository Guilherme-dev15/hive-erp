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
  const [includeGatewayBump, setIncludeGatewayBump] = useState(false);
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
  const gatewayAddonPriceCents = includeGatewayBump ? (catalog?.gatewayAddon?.priceCents ?? 4900) : 0;
  const combinedTotalCents = monthlyPriceCents + orderBumpPriceCents + gatewayAddonPriceCents;

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
        includeGatewayAddon: includeGatewayBump ? true : undefined,
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
                ? 'Ativa • Master Super Admin (Hive Pratas)'
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

      {/* Plano Único + Implantação VIP por Lote */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card Principal: Plano Pro */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-bl-full pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full mb-3">
                  <Sparkles size={13} className="text-amber-700" />
                  Plano Ilimitado Sem Restrições
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {catalog?.monthlyPlan.name ?? 'Plano Mensal HiveERP'}
                </h2>
                <p className="text-sm text-gray-600 mt-1 max-w-xl leading-relaxed">
                  Acesso irrestrito a todos os módulos: PDV, NeonStudio, vitrine pública no seu subdomínio, estoque de medidas, CRM e financeiro.
                </p>
              </div>
              <div className="sm:text-right flex-shrink-0 bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl">
                <div className="text-3xl sm:text-4xl font-extrabold text-carvao">
                  {formatBRL(monthlyPriceCents)}
                </div>
                <div className="text-xs text-gray-500 font-medium">mensal no Pix • Cancele quando quiser</div>
              </div>
            </div>

            {/* Micro-benefícios inclusos */}
            <div className="pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-700">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/80">
                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">NeonStudio™ Incluso</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/80">
                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">0% Taxas no WhatsApp</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/80">
                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Medidas cm / mm / aros</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/80">
                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">DRE & Lucro Real</span>
              </div>
            </div>
          </div>

          {/* Card VIP: Implantação Assistida de Catálogo */}
          <div
            className={`rounded-3xl border-2 p-6 sm:p-7 transition-all duration-200 relative overflow-hidden ${
              includeOrderBump
                ? 'border-dourado bg-gradient-to-br from-amber-50/60 via-yellow-50/30 to-white shadow-md ring-2 ring-dourado/20'
                : 'border-dashed border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <label className="flex items-start gap-4 cursor-pointer">
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={includeOrderBump}
                  onChange={(e) => setIncludeOrderBump(e.target.checked)}
                  className="h-5 w-5 rounded-md border-gray-300 text-carvao focus:ring-dourado cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                    <PackagePlus size={20} className="text-amber-700" />
                    ⭐ IMPLANTAÇÃO VIP: Quer que nossa equipe cadastre seu catálogo inicial?
                  </span>
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Acelere seu Início
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Economize dias de trabalho manual: envie sua planilha, fotos de fornecedor ou catálogo e nossa equipe técnica cadastra suas peças com imagens tratadas, categorias, medidas e preços prontos para vender.
                </p>
              </div>
            </label>

            {/* Seletor Visual dos Lotes de Implantação */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {setupBatches.map((batch) => {
                const isSelected = selectedBatchTier === batch.tier;
                const isPopular = batch.tier === 'UP_TO_300';
                return (
                  <button
                    key={batch.tier}
                    type="button"
                    onClick={() => {
                      setSelectedBatchTier(batch.tier);
                      setIncludeOrderBump(true);
                    }}
                    className={`relative p-4 rounded-2xl border text-left transition-all duration-150 ${
                      isSelected
                        ? 'border-carvao bg-white shadow-md ring-2 ring-dourado/50 scale-[1.02]'
                        : 'border-gray-200 bg-white/90 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2.5 right-3 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-dourado text-carvao shadow-sm">
                        ⭐ Mais Escolhido
                      </span>
                    )}
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Até {batch.maxProducts} produtos
                    </div>
                    <div className="text-xl font-extrabold text-gray-900 mt-1">
                      {formatBRL(batch.priceCents)}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Pagamento único • Fila prioritária
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dados de contato para acelerar implantação */}
            {includeOrderBump && (
              <div className="mt-5 pt-5 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                    WhatsApp para envio do catálogo
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-8888"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">
                    Origem das peças / Observação
                  </label>
                  <input
                    type="text"
                    value={sourceDescription}
                    onChange={(e) => setSourceDescription(e.target.value)}
                    placeholder="Ex: Planilha de semijoias / link do Drive"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-dourado"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card Checkout Online */}
          <div
            className={`rounded-3xl border-2 p-6 sm:p-7 transition-all duration-200 ${
              includeGatewayBump
                ? 'border-indigo-600 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white shadow-md ring-2 ring-indigo-500/20'
                : 'border-dashed border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <label className="flex items-start gap-4 cursor-pointer">
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={includeGatewayBump}
                  onChange={(e) => setIncludeGatewayBump(e.target.checked)}
                  className="h-5 w-5 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                    <CreditCard size={20} className="text-indigo-600" />
                    🚀 MÓDULO CHECKOUT ONLINE: Recebimento Automático na Vitrine (+ {formatBRL(catalog?.gatewayAddon?.priceCents ?? 4900)}/mês)
                  </span>
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                    Vendas 24h
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Permita que suas clientes paguem com Pix Automático e Cartão de Crédito parcelado direto no carrinho da sua vitrine virtual, com baixa automática de estoque. (Você continua podendo vender pelo WhatsApp tradicional normalmente).
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Painel Lateral: Resumo Financeiro & Pix Assistido */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="font-extrabold text-gray-900 text-base">Resumo da Contratação</h3>
              <span className="text-xs font-bold text-gray-400 font-mono">PIX ASSISTIDO</span>
            </div>

            {/* Linhas da Fatura */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-gray-700">
                <span className="font-medium">Plano Mensal HiveERP</span>
                <strong className="text-gray-900 font-mono">{formatBRL(monthlyPriceCents)}</strong>
              </div>

              {includeOrderBump && selectedBatch && (
                <div className="flex justify-between items-center text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60">
                  <span className="font-medium">Implantação VIP ({selectedBatch.maxProducts} peças)</span>
                  <strong className="font-mono">+{formatBRL(selectedBatch.priceCents)}</strong>
                </div>
              )}

              {includeGatewayBump && (
                <div className="flex justify-between items-center text-indigo-800 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200/60">
                  <span className="font-medium">Módulo Checkout Online</span>
                  <strong className="font-mono">+{formatBRL(catalog?.gatewayAddon?.priceCents ?? 4900)}</strong>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-gray-500 font-bold uppercase">Total a Pagar</span>
                  <p className="text-[10px] text-gray-400">Ativação imediata via Pix</p>
                </div>
                <div className="text-2xl font-extrabold text-carvao">
                  {formatBRL(combinedTotalCents)}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleCheckoutMonthly}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-carvao hover:bg-gray-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} className="text-dourado" />}
                <span>
                  {includeOrderBump && includeGatewayBump
                    ? `Confirmar Plano Pro Completo (${formatBRL(combinedTotalCents)})`
                    : includeOrderBump
                    ? `Confirmar Plano Pro + Implantação VIP (${formatBRL(combinedTotalCents)})`
                    : includeGatewayBump
                    ? `Confirmar Plano Pro + Checkout Online (${formatBRL(combinedTotalCents)})`
                    : `Confirmar Assinatura Plano Pro (${formatBRL(monthlyPriceCents)})`}
                </span>
              </button>

              {!isBlocked && selectedBatch && (
                <button
                  type="button"
                  onClick={handleStandaloneSetup}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 transition disabled:opacity-60"
                >
                  Contratar Só Implantação VIP ({formatBRL(selectedBatch.priceCents)})
                </button>
              )}
            </div>

            {/* Resultado do Pix após gerar intenção */}
            {checkoutResult ? (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Solicitação Registrada
                  </div>
                  <div>Código: <strong className="font-mono">{checkoutResult.referenceCode}</strong></div>
                  <div>Valor Pix: <strong>{formatBRL(checkoutResult.totalPriceCents)}</strong></div>
                </div>

                {checkoutResult.pix.configured && checkoutResult.pix.key ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                    <div className="font-bold text-gray-500 uppercase text-[10px]">Chave Pix ({checkoutResult.pix.keyType || 'Chave'})</div>
                    <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-gray-200">
                      <span className="font-mono text-gray-800 truncate">{checkoutResult.pix.key}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(checkoutResult.pix.key!, 'Chave Pix')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
                      >
                        <Copy size={11} /> Copiar
                      </button>
                    </div>
                  </div>
                ) : null}

                {checkoutResult.whatsappUrl && (
                  <a
                    href={checkoutResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    <MessageCircle size={15} />
                    <span>Enviar Comprovante no WhatsApp</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
                Após clicar em confirmar, você receberá a chave Pix e o botão para enviar o comprovante diretamente ao suporte técnico para liberação imediata.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Solicitações de Setup */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900">
          Minhas Solicitações de Implantação de Catálogo
        </h3>

        {!statusData?.setupRequests.length ? (
          <p className="text-sm text-gray-500">
            Nenhuma solicitação de implantação em lote registrada até o momento.
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
                      Implantação até {req.maxProducts} produtos • Total: {formatBRL(req.totalPriceCents)}
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
