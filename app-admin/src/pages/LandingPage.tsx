import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Globe,
  Package,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onStartTrial: () => void;
  onNavigate: (path: '/termos' | '/privacidade') => void;
}

const NICHES = [
  { icon: '💍', title: 'Prata 925 & 950', desc: 'Controle de estoque por malha e gramas' },
  { icon: '✨', title: 'Semijoias Banhadas', desc: 'Gestão de banhos e termos de garantia' },
  { icon: '👑', title: 'Joias em Ouro 18k', desc: 'Markup de pedras preciosas e segurança' },
  { icon: '💎', title: 'Acessórios & Zircônias', desc: 'Vitrines públicas de alto padrão visual' },
];

const FEATURES = [
  {
    icon: Camera,
    badge: 'Exclusivo',
    title: 'NeonStudio™ Fundo Branco em 1 Clique',
    description:
      'Enquadre suas joias com mira milimétrica e zoom suave de 0.5x a 5x. Exporte em fundo branco puro #FFFFFF direto do celular sem Photoshop.',
  },
  {
    icon: Ruler,
    badge: 'Especialista',
    title: 'Medidas Específicas de Joias',
    description:
      'Cadastre colares em centímetros (40cm, 45cm, 60cm), anéis com grade de aros (12 ao 26), pingentes em milímetros e correntes por malha (Veneziana, Grumet).',
  },
  {
    icon: Globe,
    badge: '0% Comissão',
    title: 'Vitrine no Seu Subdomínio',
    description:
      'Sua vitrine pública pronta em sua-loja.hiveerp.com.br. O cliente monta a sacola e o pedido chega completo no seu WhatsApp.',
  },
  {
    icon: ShoppingBag,
    title: 'Pedido Integrado ao Estoque',
    description:
      'Cada venda do catálogo dá baixa atômica no estoque de medidas e lança no fluxo de caixa automaticamente.',
  },
  {
    icon: TrendingUp,
    title: 'Financeiro & DRE em Tempo Real',
    description:
      'Acompanhe faturamento, custos de embalagem, taxas de cartão, lucro líquido e curva ABC de vendas.',
  },
  {
    icon: BarChart3,
    title: 'CRM de Clientes & LTV',
    description:
      'Veja o histórico por cliente, quem mais compra suas peças e reengaje contatos no WhatsApp com 1 clique.',
  },
];

const SETUP_BATCHES = [
  {
    tier: 'Lote Inicial',
    title: 'Até 200 produtos',
    price: 'R$ 149',
    detail: 'Cadastro e organização assistida da sua planilha ou fotos do fornecedor.',
  },
  {
    tier: 'Lote Intermediário',
    title: 'Até 300 produtos',
    price: 'R$ 199',
    detail: 'Subida completa com fotos tratadas, medidas, categorias e preços prontos para vender.',
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
    a: 'Não. Você cria sua conta com seu e-mail ou Google e recebe 14 dias grátis de acesso completo sem informar cartão.',
  },
  {
    q: 'O que é o NeonStudio e como ele me ajuda?',
    a: 'É nosso estúdio fotográfico integrado ao ERP. Você tira ou envia a foto da joia pelo próprio celular e, com 1 clique, enquadra com precisão milimétrica e gera o fundo branco puro #FFFFFF padronizado para e-commerce de joias.',
  },
  {
    q: 'Como funciona a vitrine com pedidos no WhatsApp?',
    a: 'Sua loja recebe um link exclusivo (ex: sua-loja.hiveerp.com.br). O cliente navega pelos produtos, escolhe medidas e aros, monta o carrinho e o pedido chega detalhado no seu WhatsApp, pronto para fechar a venda sem nenhuma taxa.',
  },
  {
    q: 'E se eu já tiver muitos produtos e não quiser cadastrar na mão?',
    a: 'Você pode contratar nosso serviço opcional de Implantação VIP: envie sua planilha ou fotos do fornecedor e nossa equipe técnica sobe até 200, 300 ou 500 produtos prontos para vender.',
  },
];

export function LandingPage({ onStartTrial, onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-off-white text-carvao flex flex-col font-sans">
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
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                Especialista em Joias
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <a href="#diferenciais" className="hover:text-carvao transition">
              Diferenciais
            </a>
            <a href="#neonstudio" className="hover:text-carvao transition flex items-center gap-1">
              <span>NeonStudio™</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                Exclusivo
              </span>
            </a>
            <a href="#planos" className="hover:text-carvao transition">
              Planos & Preços
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
              className="px-4 py-2 text-xs sm:text-sm font-bold bg-carvao text-white hover:bg-gray-800 rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
            >
              <span>Testar 14 dias grátis</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-carvao to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-dourado">
              <Sparkles size={14} />
              <span>O 1º ERP Especialista em Joias, Semijoias e Prata 925 • 14 dias grátis</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Abandone as planilhas. Tenha ERP e Catálogo Online especialista em Joias e Semijoias
            </h1>

            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Chega de perder tempo calculando medidas à mão ou mandando fotos soltas no privado. O Hive ERP organiza seu estoque em centímetros e aros, trata fotos no <strong>NeonStudio</strong> e entrega pedidos prontos no seu WhatsApp.
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
                href="https://hive.hiveerp.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/25 text-white font-semibold text-sm sm:text-base hover:bg-white/10 transition inline-flex items-center justify-center gap-2"
              >
                <span>Ver Vitrine Exemplo (Hive Pratas)</span>
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-xs sm:text-sm text-gray-300">
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-xl py-2.5 px-3 border border-white/10">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-xl py-2.5 px-3 border border-white/10">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>NeonStudio™ com fundo branco puro</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-xl py-2.5 px-3 border border-white/10">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Implantação VIP de catálogo</span>
              </div>
            </div>
          </div>
        </section>

        {/* Barra de Nichos Especializados */}
        <section className="py-10 bg-white border-b border-gray-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
              Desenvolvido sob medida para as necessidades de:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {NICHES.map((niche) => (
                <div key={niche.title} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center space-y-1">
                  <span className="text-2xl block">{niche.icon}</span>
                  <h4 className="font-bold text-sm text-carvao">{niche.title}</h4>
                  <p className="text-xs text-gray-500">{niche.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Destaque NeonStudio */}
        <section id="neonstudio" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                <Camera size={14} />
                <span>Tecnologia Exclusiva de Joalheria</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-carvao tracking-tight">
                Fotos profissionais com fundo branco direto do seu celular
              </h2>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Joias exigem nitidez e apresentação impecável. Com o <strong>NeonStudio™</strong>, você não precisa pagar caro por estúdio nem perder horas no Photoshop:
              </p>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-amber-700 flex-shrink-0" />
                  <span>Enquadramento milimétrico com mira central para anéis, brincos e colares</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-amber-700 flex-shrink-0" />
                  <span>Zoom suave de 0.5x a 5.0x com ajuste fino no mouse wheel ou botões</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-amber-700 flex-shrink-0" />
                  <span>Processamento em Canvas gerando JPEG 1080x1080 em fundo branco puro (#FFFFFF)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-amber-700 flex-shrink-0" />
                  <span>Geração inteligente de código SKU (ex: ANE-HP-482)</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartTrial}
                  className="px-6 py-3 bg-carvao hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-dourado" />
                  <span>Testar NeonStudio Grátis</span>
                </button>
              </div>
            </div>

            <div className="bg-carvao rounded-3xl p-6 text-white border border-gray-800 shadow-xl space-y-4">
              <div className="aspect-square rounded-2xl bg-white p-6 flex flex-col items-center justify-center text-center text-carvao relative overflow-hidden">
                <div className="w-40 h-40 rounded-full border border-dashed border-gray-300 absolute flex items-center justify-center pointer-events-none opacity-40">
                  <div className="w-20 h-20 border border-gray-200 rounded-full"></div>
                </div>
                <span className="text-5xl mb-2">💎</span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Preview NeonStudio</span>
                <span className="text-sm font-extrabold text-carvao mt-0.5">Colar Ponto de Luz Prata 925</span>
                <span className="text-[11px] font-bold text-emerald-600 mt-1">✓ Fundo Branco #FFFFFF Puro</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-mono">
                <span>Pan X/Y Interativo</span>
                <span>Zoom: 1.8x</span>
                <span>1080 x 1080 px</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recursos Gerais */}
        <section id="diferenciais" className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-y border-gray-200/80">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Operação Completa para Joalherias
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-carvao mt-2">
                Tudo o que sua marca precisa do estoque ao faturamento
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Pensado para operações que precisam vender rápido pelo WhatsApp mantendo precisão de medidas e controle financeiro total.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-off-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center">
                        <Icon size={22} />
                      </div>
                      {feature.badge && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-carvao">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Planos & Implantação VIP */}
        <section id="planos" className="py-16 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Preço Transparente
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-carvao mt-2">
              Plano Único Completo + Implantação VIP Opcional
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Comece com 14 dias grátis. Pague via Pix somente se decidir continuar, ou contrate nossa equipe para cadastrar seu catálogo inicial.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            {/* Plano Mensal */}
            <div className="lg:col-span-2 bg-carvao text-white rounded-2xl p-7 flex flex-col justify-between shadow-xl border border-gray-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dourado text-carvao text-xs font-extrabold mb-4">
                  <CreditCard size={13} />
                  <span>PLANO MENSAL HIVEERP PRO</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold">R$ 97</span>
                  <span className="text-sm text-gray-300">/mês no Pix</span>
                </div>
                <p className="text-xs text-emerald-300 font-semibold mt-1">
                  14 dias grátis antes da primeira cobrança
                </p>

                <ul className="mt-6 space-y-3 text-sm text-gray-200">
                  {[
                    'Produtos, fotos e pedidos ilimitados',
                    'Vitrine pública no seu subdomínio',
                    'NeonStudio™ com fundo branco puro',
                    'Medidas de joias (cm, mm, aros)',
                    'Baixa automática de estoque e DRE',
                    'CRM de clientes com LTV e WhatsApp',
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
                className="mt-8 w-full py-3.5 px-4 rounded-xl bg-dourado text-carvao font-extrabold text-sm hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <Store size={16} />
                <span>Criar Minha Loja Grátis</span>
              </button>
            </div>

            {/* Implantação VIP por Lote */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-7 border border-gray-200 flex flex-col justify-between shadow-sm">
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
                  Contrate nossa <strong>Implantação VIP</strong> e nossa equipe técnica sobe seu catálogo de joias com fotos tratadas e medidas organizadas:
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {SETUP_BATCHES.map((batch) => (
                    <div
                      key={batch.title}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between"
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
                  O cadastro manual no painel continua 100% livre e ilimitado para sempre em qualquer plano.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Tire Suas Dúvidas</span>
            <h2 className="text-2xl font-extrabold text-carvao mt-1">Perguntas Frequentes</h2>
          </div>
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
            <span>O ERP especialista em Joias, Semijoias e Prata 925</span>
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
