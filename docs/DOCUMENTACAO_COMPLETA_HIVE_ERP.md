# Hive ERP — Documentação Completa da Plataforma
*Versão 2.5 • Atualizado em Novembro/2026*

---

## 1. Visão Executiva e Proposta de Valor

### 1.1 O que é o Hive ERP?
O **Hive ERP** é uma plataforma SaaS (*Software as a Service*) multitenant completa, projetada especificamente para atender às demandas operacionais, comerciais e de gestão de pequenas e médias empresas do varejo físico e digital brasileiro — com ênfase e especialização no segmento de **joias, semijoias, pratas e acessórios**.

A plataforma resolve a principal dor do lojista moderno: a fragmentação entre a gestão interna (estoque, fluxo de caixa, clientes, pedidos e expedição) e a presença digital (vitrine virtual para os clientes finais).

### 1.2 Proposta de Valor Integrada
1. **Ativação Instantânea (Onboarding em 2 minutos)**: Novo lojista se cadastra via autenticação Google/Firebase, escolhe seu subdomínio e entra imediatamente no sistema, sem fricção e sem cartão de crédito.
2. **Vitrine Pública Online Nativa**: Cada loja recebe um catálogo virtual no subdomínio (`/c/:slug`), responsivo, veloz e otimizado para celulares.
3. **Descomplicação Fiscal e Logística**: Substituição de simulações falsas de NF-e por documentos reais e legalmente válidos para o comércio desobrigado:
   - **Comprovante de Venda / Recibo do Consumidor**: Identificador sequencial auditável com QR Code de autenticidade e certificado de garantia.
   - **Declaração de Conteúdo Padrão Correios**: Documento oficial padronizado exigido pelas agências postais e transportadoras para fretes sem NF-e.
4. **Vendas Multi-Canal (Balcão + Catálogo)**: Pedidos centralizados que alimentam estoque e financeiro em tempo real, permitindo fechar vendas pelo WhatsApp ou via checkout automático.

---

## 2. Arquitetura Técnica & Segurança Multitenant

```mermaid
flowchart TD
    subgraph Frontend["Frontend SPA / PWA (app-admin)"]
        UI[React 18 + Vite + TailwindCSS]
        Router[React Router DOM]
        Contexts[AuthContext • ThemeContext]
        Interceptors[Axios 402 Gate Interceptor]
    end

    subgraph Backend["Backend API REST (nest-api)"]
        Controllers[12 Controllers Operacionais]
        PublicCtrl[PublicCatalogController]
        BillingCtrl[Billing & SuperAdmin Controllers]
        
        subgraph Guards["Camadas de Segurança"]
            AuthG[AuthGuard - JWT / Firebase]
            SubG[SubscriptionGuard - HTTP 402]
            SuperG[SuperAdminGuard - HTTP 403]
        end

        Prisma[Prisma ORM 5.22]
    end

    subgraph Database["Banco de Dados Relacional"]
        Postgres[(PostgreSQL 15+)]
    end

    UI --> Router
    Router --> Contexts
    Contexts --> Interceptors
    Interceptors -->|Rotas Admin| AuthG
    AuthG --> SubG
    SubG --> Controllers
    
    Interceptors -->|Vitrine Pública| PublicCtrl
    PublicCtrl --> Controllers
    
    Interceptors -->|Faturamento| BillingCtrl
    BillingCtrl --> Prisma
    Controllers --> Prisma
    Prisma --> Postgres
```

### 2.1 Backend (`nest-api`)
- **Framework**: NestJS 11 sob Express / Node.js 20+.
- **ORM**: Prisma ORM 5.22 conectado a banco de dados relacional PostgreSQL.
- **Autenticação**:
  - Tokens JWT emitidos pelo Firebase Authentication.
  - O `AuthGuard` valida o token com chaves públicas do Google (JWKS com cache), localiza o usuário no banco por `id`, `legacyId` ou e-mail normalizado, e injeta o objeto de contexto no request.
- **Isolamento Multitenant Estrito**:
  - Toda tabela relacional de dados operacionais (`Product`, `Order`, `Customer`, `Category`, `Supplier`, `Coupon`, `Transaction`, `Campaign`, `Config`) possui a chave estrangeira `userId` vinculada à loja proprietária.
  - Todas as queries do Prisma filtram estritamente por `where: { userId }`, impedindo vazamento de dados entre lojistas (coberto por testes de invasão e auditoria multitenant).
- **Gate de Assinatura (`SubscriptionGuard`)**:
  - Aplicado no nível de classe de todos os 12 controllers operacionais.
  - Caso o período de testes ou assinatura do lojista tenha expirado (`access.isBlocked === true`), a requisição é interceptada antes de atingir os serviços e rejeitada com **HTTP 402 PAYMENT_REQUIRED** (`code: 'SUBSCRIPTION_EXPIRED'`).
  - As rotas públicas (`PublicCatalogController`), de perfil (`/auth/me`), de pagamento (`/billing/*`) e do Super Admin dispensam o gate, permitindo a continuidade da vitrine e da regularização.

### 2.2 Frontend (`app-admin`)
- **Framework**: React 18 com Vite 7 e TypeScript.
- **Estilização**: TailwindCSS com temas dinâmicos configuráveis por lojista (cores primárias, secundárias e logotipo).
- **Resiliência e PWA**: Service Worker nativo para navegação rápida e instalação no celular do lojista.
- **Interceptors Globais**:
  - Interceptor Axios em `AuthContext.tsx` captura status 402 com código `SUBSCRIPTION_EXPIRED` e ativa o estado `isBlocked: true` em tempo real.
  - `App.tsx` encapsula o sistema no `BlockedSubscriptionShell.tsx` quando bloqueado, exibindo a tela de `AssinaturaPage.tsx` para renovação imediata.

---

## 3. Modelo de Negócio, Planos e Limitações

### 3.1 Ciclo de Vida da Conta e Planos
```mermaid
stateDiagram-v2
    [*] --> TRIAL: Onboarding (14 dias grátis)
    TRIAL --> TRIAL_WARNING: Restam <= 7 dias (Banner informativo)
    TRIAL_WARNING --> TRIAL_URGENT: Restam <= 3 dias (Banner âmbar)
    TRIAL_URGENT --> EXPIRED: Venceu 14 dias sem pagamento
    TRIAL_URGENT --> ACTIVE: Pagamento Pix confirmado
    EXPIRED --> ACTIVE: Pagamento / Ativação Super-Admin
    ACTIVE --> ACTIVE: Renovação Mensal (+30 dias)
    ACTIVE --> EXPIRED: Não renovou ao fim de 30 dias
    EXPIRED --> [*]
```

### 3.2 Tabela Comparativa de Planos e Serviços

| Recurso / Módulo | Período de Testes (Trial 14 Dias) | Plano Mensal Pro (R$ 97/mês) | Loja Expirada (Sem Renovação) |
| :--- | :---: | :---: | :---: |
| **Custo de Acesso** | **R$ 0,00** (sem cartão) | **R$ 97,00 / mês** | Suspenso até renovação |
| **Duração** | 14 dias corridos | 30 dias renováveis | Indeterminado |
| **Cadastro de Produtos** | Ilimitado manual | Ilimitado manual | Acesso bloqueado (HTTP 402) |
| **Gestão de Pedidos e PDV** | Ilimitado | Ilimitado | Acesso bloqueado (HTTP 402) |
| **Comprovantes e Declaração** | Completo | Completo | Acesso bloqueado |
| **Financeiro e Caixa** | Completo | Completo | Acesso bloqueado |
| **CRM e Clientes** | Completo | Completo | Acesso bloqueado |
| **Vitrine Pública Online** | **100% Online** | **100% Online** | **100% Online (Preservada!)** |
| **Suporte** | Chat e WhatsApp | Prioritário via WhatsApp | Suporte comercial Pix |

### 3.3 Serviços e Add-ons de Alto Ticket (Order Bumps)
1. **Implantação VIP / Setup por Lote de Produtos**:
   - *Lote até 200 produtos*: R$ 149,00 parcela única.
   - *Lote até 300 produtos*: R$ 199,00 parcela única.
   - *Lote até 500 produtos*: R$ 299,00 parcela única.
   - A equipe do Hive ERP recebe as planilhas/fotos do cliente e realiza a subida assistida e padronização completa das peças.
2. **Módulo Gateway de Pagamento Integrado no Catálogo**:
   - R$ 49,00 / mês adicional.
   - Habilita checkout online automático na vitrine pública com Pix instantâneo e Cartão de Crédito parcelado.

---

## 4. Estratégia Completa de Remarketing de Vendas do ERP

A conversão e retenção de lojistas no modelo SaaS é impulsionada por uma régua de contato estruturada via WhatsApp e pelo painel administrativo da plataforma.

```mermaid
journey
    title Jornada de Conversão e Remarketing do Lojista Hive ERP
    section Dias 1-3
      Criação da Loja: 5: Lojista
      Mensagem de Boas-Vindas WhatsApp: 5: Time Hive
      Cadastrar primeiras peças: 4: Lojista
    section Dias 7-10
      Email/WhatsApp de Dicas de Vendas: 4: Time Hive
      Teste do Catálogo no WhatsApp: 5: Lojista
    section Dias 11-13
      Aviso de Expiração Próxima (3 dias): 3: Time Hive
      Oferta Especial de Ativação Pix: 4: Time Hive
    section Dia 14
      Último Dia de Teste: 2: Lojista
      Fechamento com Suporte Dedicado: 4: Time Hive
    section Pós-Trial
      Painel Administrativo Pausado: 1: Lojista
      Vitrine Continua Ativa: 4: Lojista
      Resgate Churn com Reativação Rápida: 5: Time Hive
```

### 4.1 Scripts e Copys Prontos de Remarketing (Integrados no Super Admin)

#### Script 1: Boas-Vindas & Onboarding (Trial Recém-Iniciado)
> *Gatilho: Lojista com 1 a 3 dias de cadastro.*
> 
> "Olá, **{Nome}**! Tudo bem?  
> Sou do time do Hive ERP. Parabéns por iniciar o teste da sua loja ***{NomeDaLoja}***! 🚀  
> Vi que você já possui **{X}** produto(s) no sistema. Como está sendo sua experiência? Precisa de algum apoio para configurar sua vitrine online ou tirar dúvidas sobre o fluxo de vendas?"

#### Script 2: Alerta de Expiração de Trial (Urgência & Desconto Especial)
> *Gatilho: Lojista com $\le$ 3 dias restantes de teste grátis.*
> 
> "Olá, **{Nome}**! Tudo bem?  
> Passando para avisar que o período de avaliação da sua loja ***{NomeDaLoja}*** no Hive ERP **encerra em {X} dia(s)**. ⏳  
> Para garantir que suas operações no painel continuem sem nenhuma pausa, liberamos uma condição especial para ativação do seu **Plano Pro por apenas R$ 97/mês** com suporte prioritário via WhatsApp.  
> Podemos confirmar sua ativação agora via Pix?"

#### Script 3: Resgate de Loja Expirada (Vitrine Online & Churn Recovery)
> *Gatilho: Lojista com status EXPIRED (trial encerrado).*
> 
> "Olá, **{Nome}**! Tudo bem?  
> Notamos que o período de teste do painel da sua loja ***{NomeDaLoja}*** encerrou, mas sua **Vitrine Pública continua 100% online no ar ({link}) recebendo clientes**! ✨  
> Para que você volte a gerenciar seus pedidos, estoque e cadastros sem perder nenhuma venda, preparamos uma liberação imediata via Pix.  
> Vamos reativar seu acesso completo hoje?"

#### Script 4: Oferta de Setup Assistido VIP (Subida de Lote)
> *Gatilho: Lojistas com poucos produtos cadastrados ou solicitações pendentes.*
> 
> "Olá, **{Nome}**! Tudo bem?  
> Vi que você está estruturando sua loja ***{NomeDaLoja}*** no Hive ERP. Sabia que temos um serviço de **Implantação VIP por Lote**? 💎  
> Nossa equipe especializada cadastra, formata e organiza até 200, 300 ou 500 produtos a partir da sua planilha ou fotos, para você não perder tempo e já começar vendendo com o catálogo impecável.  
> Quer que eu te envie os detalhes e valores de implantação?"

#### Script 5: Oferta do Módulo Checkout Online Integrado
> *Gatilho: Lojistas com vendas frequentes que utilizam apenas o checkout via WhatsApp.*
> 
> "Olá, **{Nome}**! Tudo bem?  
> Atualmente sua vitrine ***{NomeDaLoja}*** fecha pedidos pelo WhatsApp. Sabia que você pode ativar o **Módulo Checkout Online Integrado**? 💳  
> Com ele, seus clientes pagam via Pix Automático e Cartão de Crédito parcelado diretamente na sua loja, com confirmação imediata. Lojas que ativam o checkout automático aumentam em até 40% a taxa de conversão!  
> Quer testar esse módulo na sua loja?"

### 4.2 Ferramenta de Remarketing no Painel Super Admin
A tela `SuperAdminPage.tsx` foi equipada com:
- **Filtro Direto de Conversão**: `Trials Expirando (<= 3 dias)`, listando instantaneamente as oportunidades mais quentes do dia.
- **Botão "Remarketing" em cada loja**: Abre a central com os 5 scripts automatizados, substitui variáveis dinâmicas (nome do lojista, loja, produtos, dias restantes) e abre o WhatsApp Web/App com 1 clique (`wa.me`).

---

## 5. Manual Funcional dos Módulos do Hive ERP

### 5.1 Dashboard & Indicadores de Performance
- **Faturamento e Caixa**: Total de vendas faturadas no período, comparativo e ticket médio.
- **Gráficos e Curva ABC**: Análise de Pareto dos produtos mais rentáveis (Classe A, B e C) para tomada de decisão em reposições.
- **Feed Operacional**: Acesso rápido a pedidos recentes e produtos que atingiram o ponto de reposição de estoque.

### 5.2 Gestão de Produtos & Precificação Inteligente
- **Cadastro Completo**: Título, SKU/código, descrição, peso, medidas (cm/mm), categoria e fornecedor.
- **Calculadora de Markup**: O lojista insere o preço de custo e a margem percentual desejada; o sistema calcula o preço de venda e o lucro projetado.
- **Variações e Atributos**: Suporte a tamanhos (ex: aros de anel 14 a 26), cores e modelos.
- **NeonStudio™**: Higienização e apresentação das imagens dos produtos para vitrine profissional.
- **Importação XLSX em Massa**: Upload de planilhas para cadastro instantâneo de centenas de produtos.

### 5.3 Controle de Estoque & Kardex
- **Rastreabilidade**: Toda entrada, saída, venda ou cancelamento registra um histórico imutável com data, quantidade anterior e quantidade posterior.
- **Alerta de Estoque Baixo**: Indicador visual automático quando a quantidade atinge o limite de segurança da loja.

### 5.4 Vendas, PDV e Pedidos
- **Balcão de Vendas Rápido**: Interface limpa para lançamento de pedidos presenciais com cálculo de troco, cupons de desconto e seleção de itens.
- **Status do Pedido**:
  - `Orçamento`: Proposta comercial que não baixa estoque até a aprovação.
  - `Aguardando Pagamento`: Pedido gerado aguardando quitação.
  - `Pago`: Confirmação de recebimento com baixa imediata no estoque e lançamento de receita.
  - `Em Separação` / `Em Produção`: Controle de expedição.
  - `Enviado`: Objeto despachado com código de rastreamento.
  - `Concluído`: Venda finalizada com sucesso.
  - `Cancelado`: Estorno de pedido com devolução automática dos itens ao estoque.

### 5.5 Documentos de Venda e Logística
- **Comprovante de Venda**:
  - Documento sequencial auditável (`REC-000001`, `AUT-YYYYMM-X`).
  - Identificação completa da loja (CNPJ/CPF, WhatsApp, endereço), do cliente e itens comprados.
  - Certificado de garantia das peças e QR Code de autenticação.
- **Declaração de Conteúdo Padrão Correios**:
  - Formulário oficial em conformidade com as exigências dos Correios e das principais transportadoras privadas (Jadlog, Loggi, Total Express).
  - Preenchimento automatizado de remetente, destinatário, discriminação de itens, quantidade e valor declarado.
  - Botão de impressão com 1 clique em `DetalhePedidoModal.tsx`.

### 5.6 Clientes & CRM
- Base unificada de clientes alimentada automaticamente por pedidos presenciais e compras na vitrine virtual.
- Histórico completo de pedidos, valor vitalício do cliente (*LTV*), ticket médio e atalho direto para conversa no WhatsApp.

### 5.7 Financeiro & Fluxo de Caixa
- Lançamento de despesas fixas e variáveis (aluguel, fornecedores, taxas de cartão).
- Lançamento automático de receitas geradas por pedidos quitados.
- Visão consolidada de entradas, saídas e saldo líquido do período.

### 5.8 Campanhas Promocionais & Cupons
- **Cupons de Desconto**: Códigos promocionais personalizados com percentual de desconto e controle de ativação.
- **Simulador de Campanhas**: Permite simular o impacto financeiro de descontos em massa em categorias inteiras antes de aplicar a alteração de preços no estoque.

### 5.9 Vitrine Virtual Pública (Catálogo)
- Subdomínio próprio da loja ou rota dedicada (`/c/:slug`).
- Filtros por categoria, ordenação por preço, busca instantânea e fotos em alta resolução.
- Carrinho de compras integrado com encaminhamento do pedido formatado diretamente para o WhatsApp comercial do lojista ou checkout automático.

### 5.10 Painel Super Admin (Gestão Global)
- Exclusivo para administradores da plataforma (controlado por allowlist e `SuperAdminGuard`).
- Visão macro de métricas: Total de Lojas, Lojas em Trial, Lojas Ativas Pagantes, Lojas Expiradas e MRR estimado.
- Ferramentas de assinatura: Ativação manual de planos (+30 dias), extensão de testes (+7 dias), expiração imediata e isenção permanente (`isExempt`).
- Importador assistido de planilhas para lojas contratantes de Setup VIP.
- **Central de Remarketing WhatsApp** com scripts prontos para conversão de vendas.

---

## 6. Guia Operacional, Implantação e Manutenção

### 6.1 Pré-Requisitos de Ambiente
- **Node.js**: v20.x ou superior.
- **Gerenciador de Pacotes**: `npm` ou `pnpm`.
- **Banco de Dados**: PostgreSQL 15 ou superior.
- **Firebase**: Projeto configurado no Firebase Console com Authentication (Google Provider habilitado).

### 6.2 Dicionário de Variáveis de Ambiente

#### Backend (`nest-api/.env`)
```bash
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@host:5432/hive_erp?schema=public"

# Servidor e Segurança
PORT=3000
JWT_SECRET="seu-jwt-secret-super-seguro"
SUPER_ADMIN_EMAILS="guibanks1@gmail.com,seu-email@admin.com"

# Planos e Precificação SaaS
SAAS_TRIAL_DAYS=14
SAAS_MONTHLY_PRICE_CENTS=9700
SAAS_MONTHLY_PLAN_NAME="Plano Mensal HiveERP"

# Order Bumps - Implantação VIP por Lote
SAAS_SETUP_BATCH_200_PRICE_CENTS=14900
SAAS_SETUP_BATCH_300_PRICE_CENTS=19900
SAAS_SETUP_BATCH_500_PRICE_CENTS=29900

# Addon Gateway de Pagamento
SAAS_GATEWAY_ADDON_PRICE_CENTS=4900

# Chave Pix para Recebimento de Assinaturas
SAAS_PIX_KEY="sua-chave-pix@empresa.com"
SAAS_PIX_KEY_TYPE="EMAIL"
SAAS_PIX_BENEFICIARY="Hive ERP Servicos Digitais"
SAAS_SUPPORT_WHATSAPP="5511999999999"
```

#### Frontend (`app-admin/.env`)
```bash
VITE_API_URL="https://sua-api.hive-erp.com"
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

### 6.3 Comandos Operacionais

```bash
# 1. Instalação de Dependências
cd hive-erp-clean
npm install

# 2. Executar Migrações do Banco de Dados
cd nest-api
npx prisma migrate deploy
npx prisma generate

# 3. Execução das Suítes de Testes
# Backend (48 suítes / 260+ testes)
npm test

# Frontend (36 arquivos / 147 testes)
cd ../app-admin
npm run test -- --run

# 4. Build de Produção
npm run build
```

---

## 7. Resumo das Últimas Atualizações e Melhorias
- ✅ **Eliminação de Erros de Ícones**: Correção do import de `Eye` em `PedidosPage.tsx` e `Copy` em `SuperAdminPage.tsx`.
- ✅ **Central de Remarketing Ativa**: Inclusão de modal com 5 scripts de alta conversão para abordagem de lojistas via WhatsApp diretamente pelo Super Admin.
- ✅ **Filtro de Trials Expirando**: Adicionado filtro `EXPIRING_SOON` para focar ações nos lojistas a $\le$ 3 dias do bloqueio.
- ✅ **Documento de Venda Real**: Implementação do Comprovante de Venda sequencial e Declaração de Conteúdo padrão Correios, eliminando a dependência de simulações falsas de SEFAZ.
- ✅ **100% de Testes Automatizados Aprovados**: Cobertura completa de autenticação, multitenancy, bloqueio 402, isolamento de inquilinos e componentes visuais.
