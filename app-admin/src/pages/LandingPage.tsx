import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Package,
  ShoppingCart,
  DollarSign,
  FileText,
  Users,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onStartTrial: () => void;
  onNavigate: (path: '/termos' | '/privacidade') => void;
}

export function LandingPage({ onStartTrial, onNavigate }: LandingPageProps) {
  const whatsappUrl =
    'https://wa.me/5511978399326?text=' +
    encodeURIComponent('Olá! Gostaria de conhecer o Hive ERP e agendar uma demonstração.');

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#222226] font-sans">
      {/* Header Fixo */}
      <header className="sticky top-0 z-30 bg-[#2b2b2e] text-[#f1f1f3] shadow-md border-b border-[#3a3a40]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-black text-xl tracking-tight">
            <span
              className="w-7 h-8 bg-[#f2a900] inline-block"
              style={{
                clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
              }}
            />
            <span>HIVE ERP</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <a href="#modulos" className="hover:text-white transition">
              Módulos
            </a>
            <a href="#segmentos" className="hover:text-white transition">
              Segmentos
            </a>
            <a href="#precos" className="hover:text-white transition">
              Preços
            </a>
            <a href="#faq" className="hover:text-white transition">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onStartTrial}
              className="text-sm font-semibold text-gray-300 hover:text-white transition px-2 py-1"
            >
              Entrar no Painel
            </button>
            <button
              type="button"
              onClick={onStartTrial}
              className="inline-flex items-center justify-center min-h-[42px] px-5 rounded-full font-bold text-sm bg-[#f2a900] text-[#1d1d20] hover:bg-amber-400 hover:shadow-md transition-all duration-200"
            >
              Começar 14 dias grátis
            </button>
          </div>
        </div>
      </header>

      {/* Hero com Colmeia Hexagonal */}
      <section className="bg-[#2b2b2e] text-[#f1f1f3] py-16 sm:py-20 border-b border-[#3a3a40]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#f2a900] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} />
              <span>O ERP e Catálogo Online Especialista</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Venda, controle o estoque e organize seu financeiro em um só lugar.
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed">
              O Hive ERP junta catálogo online no WhatsApp, controle de estoque com grade e financeiro em um painel só, na nuvem, para a sua equipe parar de brigar com planilhas.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onStartTrial}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 rounded-full font-bold text-base bg-[#f2a900] text-[#1d1d20] hover:bg-amber-400 hover:scale-[1.02] shadow-lg transition-all"
              >
                <span>Testar grátis por 14 dias</span>
                <ArrowRight size={18} />
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-full font-semibold text-base border-2 border-gray-400 text-gray-100 hover:border-white hover:text-white transition"
              >
                <MessageCircle size={18} />
                <span>Falar no WhatsApp</span>
              </a>
            </div>
            <p className="text-xs text-gray-400">
              Sem cartão de crédito. Sem fidelidade. Cancele quando quiser.
            </p>
          </div>

          {/* Colmeia Hexagonal com 6 Células */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="grid grid-cols-3 gap-2.5 max-w-[380px] w-full pb-8">
              <div
                className="aspect-[1/1.15] bg-[#f2a900] text-[#1d1d20] flex flex-col items-center justify-center p-3 text-center rounded animate-pulse"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                <b className="text-lg sm:text-xl font-extrabold block">R$ 14,8k</b>
                <span className="text-[11px] font-semibold leading-tight">vendas hoje</span>
              </div>

              <div
                className="aspect-[1/1.15] bg-[#3a3a3f] text-[#c9cbd2] flex flex-col items-center justify-center p-3 text-center translate-y-6"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                <b className="text-lg sm:text-xl font-extrabold text-white block">32</b>
                <span className="text-[11px] leading-tight">pedidos hoje</span>
              </div>

              <div
                className="aspect-[1/1.15] bg-[#3a3a3f] text-[#c9cbd2] flex flex-col items-center justify-center p-3 text-center"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                <b className="text-lg sm:text-xl font-extrabold text-white block">R$ 48,2k</b>
                <span className="text-[11px] leading-tight">a receber</span>
              </div>

              <div
                className="aspect-[1/1.15] bg-[#3a3a3f] text-[#c9cbd2] flex flex-col items-center justify-center p-3 text-center"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                <b className="text-lg sm:text-xl font-extrabold text-white block">0</b>
                <span className="text-[11px] leading-tight">itens em falta</span>
              </div>

              <div
                className="aspect-[1/1.15] bg-[#f2a900] text-[#1d1d20] flex flex-col items-center justify-center p-3 text-center translate-y-6 animate-pulse"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                <b className="text-lg sm:text-xl font-extrabold block">+28%</b>
                <span className="text-[11px] font-semibold leading-tight">lucro do mês</span>
              </div>

              <div
                className="aspect-[1/1.15] bg-[#3a3a3f] text-[#c9cbd2] flex flex-col items-center justify-center p-3 text-center"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                <b className="text-lg sm:text-xl font-extrabold text-white block">R$ 12,5k</b>
                <span className="text-[11px] leading-tight">a pagar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prova de Segmentos */}
      <div className="border-b border-gray-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap gap-6 sm:gap-12 justify-center items-center text-sm font-bold text-gray-500">
          <span>✨ Joias & Semijoias</span>
          <span>🛍️ Lojas & Varejo</span>
          <span>📦 Atacado & Revenda</span>
          <span>💍 Pratas & Acessórios</span>
          <span>🚀 E-commerces & WhatsApp</span>
        </div>
      </div>

      {/* Dores */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-10 text-center">
          Se a sua rotina parece isso, o problema não é a equipe.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-[#f2a900] transition">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Estoque que não bate</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Vende o que não tem e compra o que já sobra, porque cada setor olha para uma planilha diferente.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-[#f2a900] transition">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Catálogo confuso no WhatsApp</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Fotos soltas espalhadas, pedidos perdidos na conversa, dúvida se ainda há o aro ou peça e demora para responder.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-[#f2a900] transition">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Dinheiro sem visão</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Fim do mês chega e ninguém sabe ao certo quanto entrou, quanto saiu e quanto realmente sobrou de lucro.
            </p>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="py-20 bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-10 text-center">
            Tudo conectado: o que entra em um módulo aparece nos outros.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#f4f6f8] border border-gray-200 rounded-2xl p-6">
              <div
                className="w-11 h-12 bg-[#f2a900] flex items-center justify-center text-xl mb-4 font-bold"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                🛒
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Vendas e PDV</h3>
              <p className="text-sm text-gray-600">
                Orçamento, pedido e venda no balcão ou online, com o estoque baixando sozinho em tempo real.
              </p>
            </div>

            <div className="bg-[#f4f6f8] border border-gray-200 rounded-2xl p-6">
              <div
                className="w-11 h-12 bg-[#f2a900] flex items-center justify-center text-xl mb-4 font-bold"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                📦
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Estoque Inteligente</h3>
              <p className="text-sm text-gray-600">
                Saldo em tempo real, controle por medidas e grades (aros, banhos), alertas de estoque mínimo e baixa automática.
              </p>
            </div>

            <div className="bg-[#f4f6f8] border border-gray-200 rounded-2xl p-6">
              <div
                className="w-11 h-12 bg-[#f2a900] flex items-center justify-center text-xl mb-4 font-bold"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                💰
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Financeiro Completo</h3>
              <p className="text-sm text-gray-600">
                Contas a pagar e receber, fluxo de caixa diário, conciliação Pix e DRE gerencial simplificado.
              </p>
            </div>

            <div className="bg-[#f4f6f8] border border-gray-200 rounded-2xl p-6">
              <div
                className="w-11 h-12 bg-[#f2a900] flex items-center justify-center text-xl mb-4 font-bold"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                ✨
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">NeonStudio™ & Fotos</h3>
              <p className="text-sm text-gray-600">
                Estúdio fotográfico com fundo branco puro 1080x1080, zoom livre e enquadramento perfeito para joias e produtos.
              </p>
            </div>

            <div className="bg-[#f4f6f8] border border-gray-200 rounded-2xl p-6">
              <div
                className="w-11 h-12 bg-[#f2a900] flex items-center justify-center text-xl mb-4 font-bold"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                🤝
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Clientes & CRM</h3>
              <p className="text-sm text-gray-600">
                Histórico completo de compras por cliente, curva ABC e integração de contato no WhatsApp.
              </p>
            </div>

            <div className="bg-[#f4f6f8] border border-gray-200 rounded-2xl p-6">
              <div
                className="w-11 h-12 bg-[#f2a900] flex items-center justify-center text-xl mb-4 font-bold"
                style={{
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                }}
              >
                📊
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Relatórios Gerenciais</h3>
              <p className="text-sm text-gray-600">
                Painéis claros de faturamento, margem real por produto e desempenho de vendas por período.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos com Preços Claros */}
      <section id="precos" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 text-center">
          Planos com preço claro e sem surpresas.
        </h2>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-12 max-w-xl mx-auto">
          Escolha o plano ideal para a sua empresa e comece com 14 dias de teste grátis sem cartão.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Plano Pro Principal */}
          <div className="bg-white border-2 border-[#f2a900] rounded-2xl p-8 flex flex-col justify-between shadow-lg relative">
            <span className="absolute -top-3 left-6 bg-[#f2a900] text-[#1d1d20] text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              Mais Escolhido
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Plano Pro</h3>
              <p className="text-xs text-gray-500 mt-1">Acesso completo para gerir e vender.</p>
              <div className="my-6">
                <span className="text-4xl font-black text-gray-900">R$ 97</span>
                <span className="text-sm text-gray-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Catálogo online no seu subdomínio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Vendas no WhatsApp com 0% de taxas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Estoque com medidas (aros, cm, mm)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>NeonStudio™ fotos de produtos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Financeiro, fluxo de caixa e DRE</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onStartTrial}
              className="mt-8 w-full py-3.5 rounded-full bg-[#f2a900] font-bold text-sm text-[#1d1d20] hover:bg-amber-400 shadow-md transition"
            >
              Começar 14 dias grátis
            </button>
          </div>

          {/* Add-on de Checkout Online */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Checkout Online</h3>
              <p className="text-xs text-gray-500 mt-1">Recebimento automático na vitrine.</p>
              <div className="my-6">
                <span className="text-4xl font-black text-gray-900">+ R$ 49</span>
                <span className="text-sm text-gray-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Pix automático com QR Code no carrinho</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Cartão de crédito parcelado integrado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Baixa imediata e automática de estoque</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Conexão direta com Mercado Pago</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Módulo opcional somado ao Plano Pro</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onStartTrial}
              className="mt-8 w-full py-3 rounded-full border-2 border-gray-300 font-bold text-sm text-gray-800 hover:border-gray-900 transition"
            >
              Testar 14 dias grátis
            </button>
          </div>

          {/* Implantação VIP */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Implantação VIP</h3>
              <p className="text-xs text-gray-500 mt-1">Nós cadastramos tudo para você.</p>
              <div className="my-6">
                <span className="text-4xl font-black text-gray-900">R$ 97</span>
                <span className="text-xs text-gray-500 font-medium ml-1">parcela única</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Setup de até 200 produtos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Opções de até 300 produtos ou até 500 produtos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Higienização de fotos e títulos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1f8a5b] flex-shrink-0" />
                  <span>Treinamento prático da equipe</span>
                </li>
              </ul>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full py-3 rounded-full border-2 border-gray-300 font-bold text-sm text-gray-800 hover:border-gray-900 text-center transition"
            >
              Falar com Consultor
            </a>
          </div>
        </div>
      </section>

      {/* Dúvidas Frequentes FAQ */}
      <section id="faq" className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-8 text-center">
            Dúvidas frequentes
          </h2>
          <div className="space-y-3 text-sm">
            <details className="bg-[#f4f6f8] border border-gray-200 rounded-xl p-4 cursor-pointer">
              <summary className="font-bold text-gray-900">Preciso instalar algum programa?</summary>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Não. O Hive ERP funciona diretamente no navegador e também como aplicativo PWA no celular e tablet, sem necessidade de instalação complexa ou servidor próprio.
              </p>
            </details>
            <details className="bg-[#f4f6f8] border border-gray-200 rounded-xl p-4 cursor-pointer">
              <summary className="font-bold text-gray-900">O sistema emite nota fiscal?</summary>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Não. O Hive ERP é 100% focado na gestão operacional, comercial e financeira (vendas, catálogo online no WhatsApp, controle de estoque com grade, CRM e DRE). Não realizamos emissão fiscal (NF-e/NFC-e), permitindo que você mantenha sua rotina fiscal com seu emissor ou contador habitual com total liberdade.
              </p>
            </details>
            <details className="bg-[#f4f6f8] border border-gray-200 rounded-xl p-4 cursor-pointer">
              <summary className="font-bold text-gray-900">Posso importar meus dados de planilhas?</summary>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Sim. Você pode importar seus produtos, fornecedores e clientes por planilha Excel/CSV, ou contratar nosso Setup VIP onde nossa equipe realiza todo o trabalho por você.
              </p>
            </details>
            <details className="bg-[#f4f6f8] border border-gray-200 rounded-xl p-4 cursor-pointer">
              <summary className="font-bold text-gray-900">Meus dados estão seguros?</summary>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Sim, 100% seguros. Toda a comunicação trafega com criptografia SSL/TLS de ponta a ponta, backups diários automáticos na nuvem e controle rigoroso de permissões de usuário em conformidade com a LGPD.
              </p>
            </details>
            <details className="bg-[#f4f6f8] border border-gray-200 rounded-xl p-4 cursor-pointer">
              <summary className="font-bold text-gray-900">Existe fidelidade ou multa de cancelamento?</summary>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Não. Não exigimos nenhum contrato de fidelidade. Você pode cancelar sua assinatura a qualquer momento e exportar todos os seus dados sem nenhuma taxa ou multa.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2b2b2e] text-[#b5b7bf] py-10 border-t border-[#3a3a40] text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap justify-between items-center gap-4">
          <div>© 2026 Hive ERP. Todos os direitos reservados. CNPJ sob consulta.</div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/termos')}
              className="hover:text-white transition underline underline-offset-2"
            >
              Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/privacidade')}
              className="hover:text-white transition underline underline-offset-2"
            >
              Política de Privacidade (LGPD)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
