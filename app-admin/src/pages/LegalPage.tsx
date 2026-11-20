import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

interface LegalPageProps {
  document: 'terms' | 'privacy';
  onNavigate: (path: '/termos' | '/privacidade') => void;
  onGoToApp: () => void;
}

export function LegalPage({ document, onNavigate, onGoToApp }: LegalPageProps) {
  const isTerms = document === 'terms';

  return (
    <div className="min-h-screen bg-off-white text-carvao py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navegação superior */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onGoToApp}
            className="inline-flex items-center gap-2 text-sm font-semibold text-carvao hover:text-gray-700 transition"
          >
            <ArrowLeft size={16} />
            <span>Acessar Painel</span>
          </button>

          <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => onNavigate('/termos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isTerms ? 'bg-carvao text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/privacidade')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                !isTerms ? 'bg-carvao text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Política de Privacidade
            </button>
          </div>
        </div>

        {/* Documento */}
        <article className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
              {isTerms ? <FileText size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-carvao">
                {isTerms ? 'Termos de Uso — HiveERP' : 'Política de Privacidade (LGPD) — HiveERP'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Última atualização: Novembro de 2026
              </p>
            </div>
          </div>

          {isTerms ? (
            <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
              <section className="space-y-1.5">
                <h2 className="text-base font-bold text-carvao">1. Objeto do Serviço</h2>
                <p>
                  O HiveERP é uma plataforma SaaS de gestão comercial (ERP) integrada a catálogo
                  online público por subdomínio, voltada a lojistas para controle de produtos,
                  estoque, pedidos, finanças, campanhas promocionais e relacionamento com clientes.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-base font-bold text-carvao">
                  2. Período de Teste (Trial) e Assinatura
                </h2>
                <p>
                  Novas lojas criadas na plataforma recebem 14 (quatorze) dias corridos de avaliação
                  gratuita sem exigência de cartão de crédito. Após o término do período de teste ou
                  do ciclo mensal contratado, o acesso ao painel administrativo é suspenso até a
                  confirmação do pagamento via Pix assistido, mantendo a vitrine pública online.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-base font-bold text-carvao">
                  3. Serviço Opcional de Setup Assistido por Lote
                </h2>
                <p>
                  O lojista possui cadastro manual ilimitado de produtos sem custo adicional. A
                  contratação de lotes de Setup Assistido (até 200, 300 ou 500 produtos) é opcional
                  e refere-se exclusivamente à importação assistida inicial conforme planilhas ou
                  fontes fornecidas pelo contratante.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-base font-bold text-carvao">
                  4. Responsabilidades e Cancelamento
                </h2>
                <p>
                  O lojista é integralmente responsável pela veracidade de preços, estoque,
                  tributos, imagens e atendimento aos consumidores finais da sua vitrine. O
                  cancelamento da assinatura mensal pode ser solicitado a qualquer momento sem
                  multa ou fidelidade.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
              <section className="space-y-1.5">
                <h2 className="text-base font-bold text-carvao">
                  1. Conformidade com a LGPD (Lei nº 13.709/2018)
                </h2>
                <p>
                  Esta Política descreve como o HiveERP trata dados pessoais em conformidade com a
                  Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), observando os
                  princípios de finalidade, adequação, necessidade, segurança e transparência.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-base font-bold text-carvao">2. Dados Tratados e Finalidade</h2>
                <p>
                  Coletamos dados de autenticação do lojista via Google/Firebase Authentication
                  (nome, e-mail e identificador único), dados operacionais da loja (nome, slug e
                  WhatsApp comercial) e registros inseridos pelo próprio lojista (produtos,
                  pedidos, transações e contatos de clientes) exclusivamente para execução do
                  contrato e funcionamento do ERP.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-base font-bold text-carvao">
                  3. Isolamento Multitenant e Compartilhamento
                </h2>
                <p>
                  Os dados de cada loja são isolados logicamente por tenant no banco PostgreSQL,
                  impedindo acesso cruzado entre lojistas. Utilizamos apenas provedores de
                  infraestrutura essenciais à operação (hospedagem Vercel, banco PostgreSQL e
                  autenticação Firebase), sem comercialização de dados com terceiros.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-base font-bold text-carvao">
                  4. Direitos do Titular e Contato
                </h2>
                <p>
                  Nos termos do art. 18 da LGPD, o titular pode solicitar confirmação de
                  tratamento, acesso, correção, portabilidade ou eliminação de seus dados através do
                  canal oficial de suporte indicado na página de Assinatura do painel.
                </p>
              </section>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
