import { Clock, CreditCard, AlertTriangle, Sparkles, MessageCircle } from 'lucide-react';
import type { SubscriptionSummary } from '../types';

interface TrialBannerProps {
  subscription: SubscriptionSummary;
  onGoToBilling: () => void;
}

export function TrialBanner({ subscription, onGoToBilling }: TrialBannerProps) {
  const days = subscription.daysRemaining ?? 0;
  const isCritical = days <= 1;
  const isUrgent = days <= 3 && !isCritical;

  const whatsappSupportUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(
    'Olá! Estou testando o Hive ERP e gostaria de tirar uma dúvida sobre planos e ativação.'
  )}`;

  if (isCritical) {
    return (
      <div
        role="region"
        aria-label="Aviso de último dia de teste"
        className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 text-white px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md"
      >
        <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wider text-[11px] bg-white/20 px-2 py-0.5 rounded-full mr-2">
              🚨 Último Dia de Teste Grátis
            </span>
            <span>
              Seu acesso administrativo encerra hoje. Ative seu plano agora para não pausar suas operações no painel.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={onGoToBilling}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-white text-red-700 hover:bg-gray-100 transition shadow-sm"
          >
            <Sparkles size={14} />
            <span>Ativar Agora via Pix (R$ 97)</span>
          </button>
        </div>
      </div>
    );
  }

  if (isUrgent) {
    return (
      <div
        role="region"
        aria-label="Aviso de período de teste prestes a expirar"
        className="bg-amber-50 border-b border-amber-300 text-amber-950 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
      >
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <Clock size={18} className="text-amber-700 flex-shrink-0 animate-pulse" />
          <div>
            <span className="font-extrabold text-[11px] uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full mr-2">
              Resta(m) {days} dia(s)
            </span>
            <span>
              Seu período de teste grátis está acabando. Garanta a continuidade do seu painel sem perder nenhum dado.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={onGoToBilling}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
          >
            <CreditCard size={14} />
            <span>Assinar Plano / Setup</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Aviso de período de teste"
      className="bg-slate-900 text-gray-100 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
    >
      <div className="flex items-center gap-2.5 text-xs sm:text-sm">
        <Clock size={16} className="text-dourado flex-shrink-0" />
        <span>
          <strong>Período de teste gratuito:</strong> restam {days} dias de acesso completo a todas as ferramentas.
        </span>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          onClick={onGoToBilling}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-dourado hover:opacity-90 text-carvao transition"
        >
          <CreditCard size={14} />
          <span>Assinar Plano ou Setup</span>
        </button>
      </div>
    </div>
  );
}
