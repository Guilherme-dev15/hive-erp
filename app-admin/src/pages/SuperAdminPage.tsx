import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Crown,
  Loader2,
  MessageCircle,
  PackagePlus,
  RefreshCw,
  Search,
  ShieldAlert,
  Store,
  Upload,
  X,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  getSuperAdminOverview,
  getSuperAdminSetupRequests,
  getSuperAdminTenants,
  importProductsForTenant,
  updateSuperAdminSetupRequest,
  updateTenantSubscription,
} from '../services/apiService';
import type {
  ProdutoAdmin,
  SetupRequestStatus,
  SuperAdminOverview,
  SuperAdminSetupRequestItem,
  SuperAdminSubscriptionAction,
  SuperAdminTenantItem,
} from '../types';

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDateBR(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
}

function parseSheetNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value !== 'string') {
    return fallback;
  }
  const cleaned = value.replace(/[R$\s]/gi, '').trim();
  if (!cleaned) return fallback;
  // Normaliza formato brasileiro (1.234,56 -> 1234.56) mantendo ponto decimal simples (89.90)
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

interface RemarketingTemplate {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  getText: (tenant: SuperAdminTenantItem) => string;
}

const REMARKETING_TEMPLATES: RemarketingTemplate[] = [
  {
    id: 'trial_welcome',
    title: 'Boas-Vindas & Onboarding (Trial Ativo)',
    badge: 'Onboarding',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    getText: (t) =>
      `Olá, ${t.name}! Tudo bem?\n\nSou do time do Hive ERP. Parabéns por iniciar o teste da sua loja *${t.storeName}*!\n\nVi que você já possui ${t.productsCount} produto(s) no sistema. Como está sendo sua experiência? Precisa de algum apoio para configurar sua vitrine online ou tirar dúvidas sobre o fluxo de vendas?`,
  },
  {
    id: 'trial_expiring',
    title: 'Alerta de Expiração de Trial (Urgência & Desconto)',
    badge: 'Urgência',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    getText: (t) => {
      const days = t.subscription.daysRemaining ?? 1;
      const daysText = days <= 1 ? 'encerra hoje' : `encerra em ${days} dia(s)`;
      return `Olá, ${t.name}! Tudo bem?\n\nPassando para avisar que o período de avaliação da sua loja *${t.storeName}* no Hive ERP ${daysText}.\n\nPara garantir que suas operações no painel continuem sem pausa, liberamos uma condição especial para ativação do seu *Plano Pro por apenas R$ 97/mês* com suporte prioritário via WhatsApp.\n\nPodemos confirmar sua ativação agora via Pix?`;
    },
  },
  {
    id: 'expired_recovery',
    title: 'Resgate de Loja Expirada (Vitrine Online & Churn)',
    badge: 'Recuperação',
    badgeColor: 'bg-red-50 text-red-800 border-red-200',
    getText: (t) => {
      const publicLink = t.slug ? `https://hive-erp.vercel.app/c/${t.slug}` : 'seu catálogo';
      return `Olá, ${t.name}! Tudo bem?\n\nNotamos que o período de teste do painel da sua loja *${t.storeName}* encerrou, mas sua *Vitrine Pública continua 100% online* no ar (${publicLink}) recebendo clientes!\n\nPara que você volte a gerenciar seus pedidos, estoque e cadastros sem perder nenhuma venda, preparamos uma liberação imediata via Pix.\n\nVamos reativar seu acesso completo hoje?`;
    },
  },
  {
    id: 'upsell_setup',
    title: 'Oferta de Implantação VIP / Setup por Lote',
    badge: 'Serviço VIP',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    getText: (t) =>
      `Olá, ${t.name}! Tudo bem?\n\nVi que você está estruturando sua loja *${t.storeName}* no Hive ERP. Sabia que temos um serviço de *Implantação VIP por Lote*?\n\nNossa equipe especializada cadastra, formata e organiza até 200, 300 ou 500 produtos a partir da sua planilha ou fotos, para você não perder tempo e já começar vendendo com o catálogo impecável.\n\nQuer que eu te envie os detalhes e valores de implantação?`,
  },
  {
    id: 'upsell_gateway',
    title: 'Oferta do Módulo Checkout Online / Gateway',
    badge: 'Checkout Pix',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    getText: (t) =>
      `Olá, ${t.name}! Tudo bem?\n\nAtualmente sua vitrine *${t.storeName}* fecha pedidos pelo WhatsApp. Sabia que você pode ativar o *Módulo Checkout Online Integrado*?\n\nCom ele, seus clientes pagam via Pix Automático e Cartão de Crédito parcelado diretamente na sua loja, com confirmação imediata. Lojas com checkout automático aumentam em até 40% a taxa de conversão!\n\nQuer testar esse módulo na sua loja?`,
  },
];

export function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'setups'>('tenants');
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [tenants, setTenants] = useState<SuperAdminTenantItem[]>([]);
  const [setupRequests, setSetupRequests] = useState<SuperAdminSetupRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [setupStatusFilter, setSetupStatusFilter] = useState('ALL');

  // Modal de Importação Assistida para Loja
  const [importTarget, setImportTarget] = useState<{
    userId: string;
    storeName: string;
    setupRequestId?: string;
    maxProducts?: number;
  } | null>(null);
  const [parsedProducts, setParsedProducts] = useState<Partial<ProdutoAdmin>[]>([]);
  const [importing, setImporting] = useState(false);

  // Modal de Remarketing de Vendas do ERP
  const [selectedRemarketingTenant, setSelectedRemarketingTenant] = useState<SuperAdminTenantItem | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('trial_welcome');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [targetPhone, setTargetPhone] = useState<string>('');

  const handleOpenRemarketing = (tenant: SuperAdminTenantItem) => {
    setSelectedRemarketingTenant(tenant);
    setTargetPhone(tenant.whatsappNumber || '');

    let initialTemplateId = 'trial_welcome';
    if (tenant.subscription.effectiveStatus === 'EXPIRED' || tenant.subscription.effectiveStatus === 'CANCELED') {
      initialTemplateId = 'expired_recovery';
    } else if (
      tenant.subscription.effectiveStatus === 'TRIAL' &&
      (tenant.subscription.daysRemaining ?? 0) <= 3
    ) {
      initialTemplateId = 'trial_expiring';
    } else if (tenant.productsCount <= 5 && tenant.openSetupRequestsCount > 0) {
      initialTemplateId = 'upsell_setup';
    }

    setActiveTemplateId(initialTemplateId);
    const tmpl = REMARKETING_TEMPLATES.find((t) => t.id === initialTemplateId);
    setCustomMessage(tmpl ? tmpl.getText(tenant) : '');
  };

  const handleSelectTemplate = (templateId: string) => {
    if (!selectedRemarketingTenant) return;
    setActiveTemplateId(templateId);
    const tmpl = REMARKETING_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setCustomMessage(tmpl.getText(selectedRemarketingTenant));
    }
  };

  const handleCopyMessage = async () => {
    if (!customMessage) return;
    try {
      await navigator.clipboard.writeText(customMessage);
      toast.success('Mensagem copiada para a área de transferência!');
    } catch {
      toast.error('Não foi possível copiar a mensagem.');
    }
  };

  const handleSendWhatsApp = () => {
    const rawDigits = targetPhone.replace(/\D/g, '');
    const cleanPhone = rawDigits.startsWith('55') ? rawDigits : `55${rawDigits}`;
    if (!rawDigits || rawDigits.length < 10) {
      toast.error('Informe um número de WhatsApp válido com DDD.');
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, tList, sList] = await Promise.all([
        getSuperAdminOverview(),
        getSuperAdminTenants({
          search: searchTerm.trim() || undefined,
          status: statusFilter,
        }),
        getSuperAdminSetupRequests({
          status: setupStatusFilter,
          search: searchTerm.trim() || undefined,
        }),
      ]);
      setOverview(ov);
      setTenants(tList);
      setSetupRequests(sList);
    } catch (error) {
      console.error('Erro ao carregar Super-Admin:', error);
      toast.error('Não foi possível carregar os dados da plataforma.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, setupStatusFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleTenantAction = async (
    tenant: SuperAdminTenantItem,
    action: SuperAdminSubscriptionAction,
    days?: number,
    isExempt?: boolean,
  ) => {
    setBusyId(tenant.id);
    try {
      await updateTenantSubscription(tenant.id, {
        action,
        days,
        isExempt,
        note: `Ação manual Super-Admin (${action})`,
      });
      toast.success(`Loja "${tenant.storeName}" atualizada.`);
      await loadAll();
    } catch (error) {
      console.error('Erro ao atualizar assinatura do tenant:', error);
      toast.error('Erro ao atualizar assinatura da loja.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSetupStatusChange = async (
    reqItem: SuperAdminSetupRequestItem,
    status: SetupRequestStatus,
    activateMonthlyPlanToo = false,
  ) => {
    setBusyId(reqItem.id);
    try {
      await updateSuperAdminSetupRequest(reqItem.id, {
        status,
        activateMonthlyPlanToo,
      });
      toast.success(`Solicitação ${reqItem.referenceCode} atualizada para ${status}.`);
      await loadAll();
    } catch (error) {
      console.error('Erro ao atualizar setup request:', error);
      toast.error('Erro ao atualizar solicitação de setup.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSpreadsheetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
        const mapped: Partial<ProdutoAdmin>[] = rows.map((row) => ({
          name: String(row['Nome'] || row['Produto'] || row['name'] || 'Sem Nome'),
          code: String(row['Código'] || row['code'] || ''),
          category: String(row['Categoria'] || row['category'] || 'Geral'),
          salePrice: Math.max(0, parseSheetNumber(row['Preço Venda'] ?? row['salePrice'], 0)),
          costPrice: Math.max(0, parseSheetNumber(row['Custo'] ?? row['costPrice'], 0)),
          quantity: Math.max(0, Math.trunc(parseSheetNumber(row['Estoque'] ?? row['quantity'], 0))),
          description: String(row['Descrição'] || row['description'] || ''),
          imageUrl: String(row['Imagem URL'] || row['imageUrl'] || ''),
        }));
        setParsedProducts(mapped);
      } catch {
        toast.error('Erro ao ler a planilha.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (!importTarget || parsedProducts.length === 0) return;
    setImporting(true);
    try {
      const res = await importProductsForTenant(importTarget.userId, {
        products: parsedProducts,
        setupRequestId: importTarget.setupRequestId,
      });
      toast.success(`${res.count} produto(s) importado(s) para "${importTarget.storeName}".`);
      setImportTarget(null);
      setParsedProducts([]);
      await loadAll();
    } catch (error) {
      console.error('Erro na importação assistida:', error);
      toast.error('Erro ao importar produtos para a loja.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* KPIs da Plataforma */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
            <Store size={14} className="text-carvao" /> Total Lojas
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            {overview?.totalTenants ?? 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
            <Clock size={14} /> Em Trial
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">
            {overview?.trialTenants ?? 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Pagantes Ativas
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {overview?.activePaidTenants ?? 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-red-700 flex items-center gap-1.5">
            <ShieldAlert size={14} /> Expiradas
          </div>
          <div className="text-2xl font-extrabold text-red-700 mt-1">
            {overview?.expiredOrCanceledTenants ?? 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
            <PackagePlus size={14} /> Setups Pendentes
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">
            {overview?.pendingSetupRequests ?? 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
            <Crown size={14} className="text-dourado" /> MRR Estimado
          </div>
          <div className="text-xl font-extrabold text-gray-900 mt-1">
            {formatBRL(overview?.estimatedMrrCents ?? 0)}
          </div>
        </div>
      </div>

      {/* Navegação por Abas + Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'tenants'
                ? 'bg-carvao text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lojas & Assinaturas ({tenants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('setups')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'setups'
                ? 'bg-carvao text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Implantação & Lotes de Produtos ({setupRequests.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar loja, e-mail, slug..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dourado"
            />
          </div>

          {activeTab === 'tenants' ? (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
            >
              <option value="ALL">Todos os status</option>
              <option value="TRIAL">Em Trial</option>
              <option value="EXPIRING_SOON">Trials Expirando (≤ 3 dias)</option>
              <option value="ACTIVE">Ativas</option>
              <option value="EXPIRED">Expiradas</option>
              <option value="CANCELED">Canceladas</option>
              <option value="SUSPENDED">Contas Suspensas</option>
            </select>
          ) : (
            <select
              value={setupStatusFilter}
              onChange={(e) => setSetupStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
            >
              <option value="ALL">Todos os setups</option>
              <option value="PENDING">Aguardando Pagamento</option>
              <option value="PAID">Pagos</option>
              <option value="IN_PROGRESS">Em Execução</option>
              <option value="COMPLETED">Concluídos</option>
              <option value="CANCELED">Cancelados</option>
            </select>
          )}

          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700"
            title="Atualizar"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Aba Lojas & Assinaturas */}
      {activeTab === 'tenants' && (
        <div className="space-y-3">
          {loading && tenants.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-gray-100 flex justify-center">
              <Loader2 className="animate-spin text-carvao" size={28} />
            </div>
          ) : tenants.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-sm text-gray-500">
              Nenhuma loja encontrada para os filtros aplicados.
            </div>
          ) : (
            tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900">{tenant.storeName}</h3>
                    {tenant.slug && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {tenant.slug}
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        tenant.subscription.isExempt
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : tenant.subscription.effectiveStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tenant.subscription.effectiveStatus === 'TRIAL'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {tenant.subscription.isExempt ? 'ISENTA' : tenant.subscription.effectiveStatus}
                    </span>
                    {!tenant.active && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-600 text-white">
                        CONTA SUSPENSA
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {tenant.name} • <strong>{tenant.email}</strong>
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    <span>Produtos: <strong>{tenant.productsCount}</strong></span>
                    <span>Pedidos: <strong>{tenant.ordersCount}</strong></span>
                    <span>
                      Válido até:{' '}
                      <strong>
                        {tenant.subscription.effectiveStatus === 'ACTIVE'
                          ? formatDateBR(tenant.subscription.currentPeriodEnd)
                          : formatDateBR(tenant.subscription.trialEndsAt)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRemarketing(tenant)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition shadow-sm"
                    title="Abrir estratégia de remarketing e copy pronta de WhatsApp"
                  >
                    <MessageCircle size={13} className="text-emerald-600" />
                    <span>Remarketing</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyId === tenant.id}
                    onClick={() => handleTenantAction(tenant, 'ACTIVATE_MONTHLY', 30)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    +30d Ativar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === tenant.id}
                    onClick={() => handleTenantAction(tenant, 'EXTEND_TRIAL', 7)}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition disabled:opacity-50"
                  >
                    +7d Trial
                  </button>
                  <button
                    type="button"
                    disabled={busyId === tenant.id}
                    onClick={() =>
                      setImportTarget({
                        userId: tenant.id,
                        storeName: tenant.storeName,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition"
                  >
                    <Upload size={12} /> Importar Produtos
                  </button>
                  <button
                    type="button"
                    disabled={busyId === tenant.id}
                    onClick={() => handleTenantAction(tenant, 'EXPIRE_NOW')}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition disabled:opacity-50"
                  >
                    Expirar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === tenant.id}
                    onClick={() =>
                      handleTenantAction(
                        tenant,
                        tenant.active ? 'SUSPEND_ACCOUNT' : 'REACTIVATE_ACCOUNT',
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold transition disabled:opacity-50"
                  >
                    {tenant.active ? 'Suspender' : 'Reativar'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Aba Order Bump & Setups */}
      {activeTab === 'setups' && (
        <div className="space-y-3">
          {setupRequests.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-sm text-gray-500">
              Nenhuma solicitação de setup encontrada.
            </div>
          ) : (
            setupRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-800">
                      {req.referenceCode}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                      {req.status}
                    </span>
                    {req.includeMonthlyPlan && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        Combo: Plano + Lote {req.maxProducts}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {req.storeName} • {req.ownerEmail}
                  </div>
                  <div className="text-xs text-gray-600">
                    Lote: <strong>até {req.maxProducts} produtos</strong> • Setup:{' '}
                    <strong>{formatBRL(req.priceCents)}</strong> • Total:{' '}
                    <strong>{formatBRL(req.totalPriceCents)}</strong>
                    {req.sourceDescription && ` • Origem: ${req.sourceDescription}`}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(req.contactPhone || req.storeWhatsapp) && (
                    <a
                      href={`https://wa.me/${(req.contactPhone || req.storeWhatsapp || '').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  )}
                  {req.status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleSetupStatusChange(req, 'PAID', req.includeMonthlyPlan)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      {req.includeMonthlyPlan ? 'Confirmar Pago + Ativar Plano' : 'Confirmar Pago'}
                    </button>
                  )}
                  {(req.status === 'PAID' || req.status === 'IN_PROGRESS') && (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() =>
                        setImportTarget({
                          userId: req.userId,
                          storeName: req.storeName,
                          setupRequestId: req.id,
                          maxProducts: req.maxProducts,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      <Upload size={12} /> Subir Planilha do Lote
                    </button>
                  )}
                  {req.status === 'PAID' && (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleSetupStatusChange(req, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold"
                    >
                      Iniciar
                    </button>
                  )}
                  {req.status !== 'COMPLETED' && req.status !== 'CANCELED' && (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleSetupStatusChange(req, 'COMPLETED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      Concluir Setup
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Importação Assistida por Lote */}
      {importTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900">
                  Importar Lote para {importTarget.storeName}
                </h3>
                {importTarget.maxProducts && (
                  <p className="text-xs text-gray-500">
                    Capacidade contratada: até {importTarget.maxProducts} produtos
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setImportTarget(null);
                  setParsedProducts([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
              <Upload size={26} className="text-gray-400 mb-2" />
              <span className="text-xs font-semibold text-gray-600">
                Selecionar planilha .xlsx / .xls / .csv
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleSpreadsheetSelect}
              />
            </label>

            {parsedProducts.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <strong>{parsedProducts.length}</strong> produto(s) pronto(s) para importar nesta loja.
                {importTarget.maxProducts && parsedProducts.length > importTarget.maxProducts && (
                  <span className="block text-amber-800 font-bold mt-1">
                    Atenção: a planilha excede o limite do lote contratado ({importTarget.maxProducts}).
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setImportTarget(null);
                  setParsedProducts([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={importing || parsedProducts.length === 0}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-carvao text-white text-xs font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                {importing && <Loader2 size={14} className="animate-spin" />}
                <span>Importar para Loja</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Remarketing de Vendas do ERP */}
      {selectedRemarketingTenant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
                  <Sparkles size={12} /> Remarketing de Vendas ERP
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedRemarketingTenant.storeName}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedRemarketingTenant.name} • {selectedRemarketingTenant.email} • Status:{' '}
                  <strong>{selectedRemarketingTenant.subscription.effectiveStatus}</strong>
                  {selectedRemarketingTenant.subscription.effectiveStatus === 'TRIAL' && (
                    <span> ({selectedRemarketingTenant.subscription.daysRemaining ?? 0} dias restantes)</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRemarketingTenant(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Seleção do Template */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Escolha o Objetivo / Script de Remarketing:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REMARKETING_TEMPLATES.map((tmpl) => {
                  const isSelected = activeTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-gray-900 mb-1">{tmpl.title}</div>
                      <span
                        className={`self-start text-[10px] font-bold px-2 py-0.5 rounded-full border ${tmpl.badgeColor}`}
                      >
                        {tmpl.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Telefone WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                WhatsApp do Lojista (com DDD):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="Ex: 11988887777 ou 5511988887777"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Texto da Mensagem (Editável) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  Mensagem WhatsApp (Personalizável):
                </label>
                <span className="text-[11px] text-gray-400">Suporta formatação *negrito* do WhatsApp</span>
              </div>
              <textarea
                rows={7}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed text-gray-800"
              />
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSelectedRemarketingTenant(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Fechar
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition"
                  title="Copiar texto da mensagem"
                >
                  <Copy size={14} />
                  <span>Copiar</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                  title="Abrir WhatsApp Web ou App com a mensagem preenchida"
                >
                  <MessageCircle size={14} />
                  <span>Abrir WhatsApp</span>
                  <ExternalLink size={12} className="opacity-75" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
