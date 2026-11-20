import { Clock, CreditCard } from 'lucide-react';
import type { SubscriptionSummary } from '../types';

interface TrialBannerProps {
  subscription: SubscriptionSummary;
  onGoToBilling: () => void;
}

export function TrialBanner({ subscription, onGoToBilling }: TrialBannerProps) {
  const days = subscription.daysRemaining ?? 0;
  const urgent = days <= 3;

  return (
    <div
      role="region"
      aria-label="Aviso de período de teste"
      className={`border-b px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
        urgent
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-slate-900 text-gray-100 border-slate-800'
      }`}
    >
      <div className="flex items-center gap-2.5 text-xs sm:text-sm">
        <Clock
          size={16}
          className={urgent ? 'text-amber-600 flex-shrink-0' : 'text-dourado flex-shrink-0'}
        />
        <span>
          <strong>Período de teste gratuito:</strong>{' '}
          {days <= 1
            ? 'último dia disponível.'
            : `restam ${days} dias de acesso completo ao painel.`}
        </span>
      </div>

      <button
        type="button"
        onClick={onGoToBilling}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition self-start sm:self-auto ${
          urgent
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : 'bg-dourado hover:opacity-90 text-carvao'
        }`}
      >
        <CreditCard size={14} />
        <span>Assinar Plano ou Setup de Produtos</span>
      </button>
    </div>
  );
}
