# Cronograma de Remediação — HivePratas ERP

Este documento detalha o plano de trabalho para concluir a fase de remediação técnica do projeto HivePratas ERP, transformando-o de uma aplicação com vulnerabilidades conhecidas em um sistema auditável, testado e seguro.

**Status:** ✅ Aprovado.
**Validação:** Validado contra o "Prompt Especialista" e Issues Abertas no GitHub.

---

## Tarefa 0: Administração (10 min)
*   [x] **Fechar a Issue #10** (`serviceAccountKey.json`): Resolvida pela Limpeza Forense com `git filter-repo`.

---

## 📅 Semana 1: Consolidação da Base de Testes e Regras de Negócio
**Objetivo:** Sair da dívida técnica de testes e iniciar a refatoração do `index.js` monolítico de forma segura.

### Tarefa 1.1: Expansão da Cobertura de Testes (API)
*   **Escopo:** Adicionar testes de integração para as rotas `orders`, `products`, `coupons` e `inventory`.
*   **Entregável:** Todos os testes passando (`npm run test:api`).
*   **Estimativa:** 3 dias.

### Tarefa 1.2: Refatoração da Camada de Domínio (FSM de Pedidos)
*   **Escopo:**
    1. Mover a lógica de transição de status de pedidos (atualmente no `controller`) para `src/services/order.service.js`.
    2. Aplicar as regras de negócio reais (não apenas `return true`).
    3. Criar testes unitários para a máquina de estados finita (FSM).
*   **Entregável:** Lógica de transição de pedidos 100% testada e isolada.
*   **Estimativa:** 2 dias.
*   **Status:** ✅ Concluída. Lógica de FSM implementada com 19 testes unitários (`order.service.test.js`). Commit `d100cf6`.

### Tarefa 1.3: Implementar Teste de Isolamento de Tenant (Issue #20)
*   **Escopo:** Escrever teste de integração que prova: usuário do Tenant A não consegue ler/escrever dado do Tenant B.
*   **Entregável:** Teste de regressão verde para a Regra 4 do "Prompt Especialista".
*   **Estimativa:** 2 dias.

---

## 📅 Semana 2: Performance, Segurança e Qualidade
**Objetivo:** Eliminar problemas de performance e finalizar a qualidade de código.

### Tarefa 2.1: Otimização da Rota de Dashboard
*   **Escopo:** Refatorar `/admin/dashboard/stats` para usar agregação server-side do Firestore (evitar carregar todos os pedidos).
*   **Entregável:** Rota de dashboard performática.
*   **Estimativa:** 1.5 dias.

### Tarefa 2.2: Configuração de Linting e Padronização
*   **Escopo:** Garantir que ESLint e Prettier estão configurados em todo o monorepo e o código passa.
*   **Entregável:** `npm run lint` e `npm run format` executados sem erros.
*   **Estimativa:** 1 dia.

### Tarefa 2.3: Hardening de Segurança (CSRF, Rate Limiting, CORS)
*   **Escopo:** Adicionar proteção contra CSRF. Adicionar Rate Limiting. Revisar e apertar a política de CORS.
*   **Entregável:** Middlewares de segurança ativos e testados.
*   **Estimativa:** 3 dias.

---

## 📅 Semana 3: Operação, CI/CD e Deploy
**Objetivo:** Automatizar o ciclo de vida do desenvolvimento e preparar para deploy.

### Tarefa 3.1: Pipeline de Integração Contínua (CI)
*   **Escopo:** Configurar GitHub Actions para rodar lint, build e testes em todo PR.
*   **Entregável:** Status check passando no GitHub.
*   **Estimativa:** 1 dia.

### Tarefa 3.2: Ambiente de Staging
*   **Escopo:** Criar projeto no Firebase/Vercel separado para staging, com suas próprias credenciais.
*   **Entregável:** Ambiente de staging operacional e isolado.
*   **Estimativa:** 1.5 dias.

### Tarefa 3.3: Revisão de Scripts e Documentação
*   **Escopo:**
    1. Garantir que scripts `migrate_*.js` recebem parâmetros via `.env` ou CLI.
    2. **Atualizar SECURITY.md (Issue #19).**
    3. Atualizar `README.md` e `CLAUDE.md`.
*   **Entregável:** Documentação 100% sincronizada com o código.
*   **Estimativa:** 2 dias.

---

## 📅 Semana 4: Validação Final e Entrega
**Objetivo:** Garantir que o sistema está pronto para produção.

### Tarefa 4.1: Smoke Tests em Staging
*   **Escopo:** Validar fluxos críticos (criar pedido, aplicar cupom, gerar dashboard) em ambiente de staging.
*   **Entregável:** Relatório de smoke test verde.
*   **Estimativa:** 2 dias.

### Tarefa 4.2: Checklist de Segurança Final e Backup
*   **Escopo:**
    1. Verificar rotina de backup do Firestore.
    2. Executar checklist de segurança final contra o "Prompt Especialista".
    3. Auditar regras do Firestore (`firestore.rules`).
*   **Entregável:** Relatório de conformidade. Regras versionadas.
*   **Estimativa:** 2 dias.
