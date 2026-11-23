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
            Order Bump & Setup por Lote ({setupRequests.length})
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
    </div>
  );
}
