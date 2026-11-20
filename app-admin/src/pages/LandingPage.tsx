import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Globe,
  Package,
  Percent,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';

interface LandingPageProps {
  onStartTrial: () => void;
  onNavigate: (path: '/termos' | '/privacidade') => void;
}

const FEATURES = [
  {
    icon: Globe,
    title: 'Catálogo Online no Seu Subdomínio',
    description:
      'Sua vitrine pública pronta em sua-loja.hiveerp.com.br com carrinho e fechamento rápido no WhatsApp.',
  },
  {
    icon: ShoppingBag,
    title: 'Pedido Integrado ao Estoque',
    description:
      'Cada venda do catálogo gera pedido no ERP, dá baixa atômica no estoque e lança no caixa automaticamente.',
  },
  {
    icon: TrendingUp,
    title: 'Financeiro & DRE em Tempo Real',
    description:
      'Acompanhe faturamento, despesas, lucro líquido, curva ABC e saldo geral sem planilhas paralelas.',
  },
  {
    icon: BarChart3,
    title: 'CRM com LTV & Reengajamento',
    description:
      'Veja histórico por cliente, ticket médio, recorrência e chame compradores no WhatsApp em um clique.',
  },
  {
    icon: Percent,
    title: 'Promoções com Trava Anti-Prejuízo',
    description:
      'Simule descontos em massa respeitando margem mínima e reverta campanhas instantaneamente.',
  },
  {
    icon: Package,
    title: 'Precificação & Fornecedores',
    description:
      'Calcule preço de venda com margem, taxas e embalagem, e organize fornecedores e categorias.',
  },
];

const SETUP_BATCHES = [
  {
    tier: 'Lote Inicial',
    title: 'Até 200 produtos',
    price: 'R$ 149',
    detail: 'Cadastro e organização assistida da sua planilha ou catálogo inicial.',
  },
  {
    tier: 'Lote Intermediário',
    title: 'Até 300 produtos',
    price: 'R$ 199',
    detail: 'Subida completa com categorias, preços e estoque prontos para vender.',
  },
  {
    tier: 'Lote Alto Volume',
    title: 'Até 500 produtos',
    price: 'R$ 299',
    detail: 'Implantação dedicada para catálogos extensos com validação antes da publicação.',
  },
];

const FAQS = [
  {
    q: 'Preciso cadastrar cartão de crédito para testar?',
    a: 'Não. Você cria sua loja com sua conta Google e recebe 14 dias grátis de acesso completo sem informar cartão.',
  },
  {
    q: 'Existe limite de produtos no plano mensal?',
    a: 'Não. O cadastro manual de produtos é ilimitado. Os lotes de Setup Assistido são opcionais caso queira nossa equipe subindo seu catálogo.',
  },
  {
    q: 'Como funciona a vitrine se minha assinatura vencer?',
    a: 'O painel administrativo fica protegido até a renovação, mas sua vitrine pública permanece online para você não perder presença digital.',
  },
];

export function LandingPage({ onStartTrial, onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-off-white text-carvao flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-dourado text-carvao font-extrabold flex items-center justify-center shadow-sm">
              H
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-sm uppercase block leading-none">
                HIVE ERP
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Gestão & Catálogo SaaS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#recursos" className="hover:text-carvao transition">
              Recursos
            </a>
            <a href="#planos" className="hover:text-carvao transition">
              Planos
            </a>
            <a href="#faq" className="hover:text-carvao transition">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onStartTrial}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-carvao hover:bg-gray-100 rounded-lg transition"
            >
              Entrar no Painel
            </button>
            <button
              type="button"
              onClick={onStartTrial}
              className="px-4 py-2 text-xs sm:text-sm font-bold bg-carvao text-white hover:bg-gray-800 rounded-lg shadow-sm transition inline-flex items-center gap-1.5"
            >
              <span>Testar 14 dias grátis</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-carvao to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-dourado">
              <Sparkles size={14} />
              <span>14 dias grátis • Sem cartão de crédito • Ativação imediata</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              ERP e Catálogo Online integrados para vender mais sem perder o controle do estoque
            </h1>

            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Crie sua loja em minutos, publique sua vitrine própria em{' '}
              <strong className="text-white">sua-loja.hiveerp.com.br</strong> e acompanhe pedidos,
              baixa automática de estoque, clientes (LTV) e fluxo de caixa em um único painel.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onStartTrial}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-dourado text-carvao font-extrabold text-sm sm:text-base shadow-lg hover:opacity-95 transition inline-flex items-center justify-center gap-2"
              >
                <span>Começar 14 dias grátis</span>
                <ArrowRight size={18} />
              </button>
              <a
                href="#planos"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/25 text-white font-semibold text-sm sm:text-base hover:bg-white/10 transition inline-flex items-center justify-center"
              >
                Ver Plano & Setup
              </a>
            </div>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-xs sm:text-sm text-gray-300">
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-xl py-2.5 px-3 border border-white/10">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Cadastro ilimitado de produtos</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-xl py-2.5 px-3 border border-white/10">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Subdomínio e SSL inclusos</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-xl py-2.5 px-3 border border-white/10">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Sem fidelidade ou multa</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Operação ponta a ponta
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-carvao mt-2">
              Tudo o que sua loja precisa do pedido ao DRE
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Pensado para operações enxutas que precisam vender rápido pelo WhatsApp mantendo
              precisão financeira e estoque confiável.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-base text-carvao mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Planos & Order Bump Setup */}
        <section id="planos" className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-y border-gray-200/80">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Preço transparente
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-carvao mt-2">
                Plano único completo + Setup Assistido opcional
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Comece com 14 dias grátis. Pague via Pix somente se decidir continuar, ou contrate
                um lote de subida para já começar com seu catálogo pronto.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
              {/* Plano Mensal */}
              <div className="lg:col-span-2 bg-carvao text-white rounded-2xl p-7 flex flex-col justify-between shadow-xl border border-gray-800">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dourado text-carvao text-xs font-extrabold mb-4">
                    <CreditCard size={13} />
                    <span>PLANO MENSAL HIVEERP</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold">R$ 97</span>
                    <span className="text-sm text-gray-300">/mês</span>
                  </div>
                  <p className="text-xs text-emerald-300 font-semibold mt-1">
                    14 dias grátis antes da primeira cobrança
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-gray-200">
                    {[
                      'Produtos e pedidos ilimitados',
                      'Vitrine pública no seu subdomínio',
                      'Baixa automática de estoque e DRE',
                      'CRM de clientes com LTV e WhatsApp',
                      'Campanhas promocionais e cupons',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-dourado mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onStartTrial}
                  className="mt-8 w-full py-3 px-4 rounded-xl bg-dourado text-carvao font-extrabold text-sm hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  <Store size={16} />
                  <span>Criar Minha Loja Grátis</span>
                </button>
              </div>

              {/* Setup Assistido por Lote */}
              <div className="lg:col-span-3 bg-off-white rounded-2xl p-7 border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                      Opcional • Pagamento Único
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Disponível dentro do painel
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-carvao">
                    Quer começar sem perder dias cadastrando planilhas?
                  </h3>
                  <p className="text-sm text-gray-600 mt-1.5">
                    Contrate nosso Setup Assistido por lote e nossa equipe sobe seu catálogo por
                    você:
                  </p>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {SETUP_BATCHES.map((batch) => (
                      <div
                        key={batch.title}
                        className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            {batch.tier}
                          </span>
                          <h4 className="font-bold text-sm text-carvao mt-1">{batch.title}</h4>
                          <p className="text-2xl font-extrabold text-carvao mt-2">{batch.price}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                          {batch.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-2.5 text-xs text-gray-600">
                  <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>
                    O cadastro manual no painel continua 100% livre e ilimitado em qualquer plano.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-carvao text-center mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm"
              >
                <h3 className="font-bold text-sm sm:text-base text-carvao">{faq.q}</h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-carvao text-gray-300 py-8 px-4 sm:px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">HIVE ERP</span>
            <span>•</span>
            <span>ERP + Catálogo Online Multitenant</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onNavigate('/termos')}
              className="hover:text-white underline-offset-4 hover:underline transition"
            >
              Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/privacidade')}
              className="hover:text-white underline-offset-4 hover:underline transition"
            >
              Política de Privacidade
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
