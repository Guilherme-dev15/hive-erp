# HivePratas — Próximos Passos & Backlog

> **Última atualização:** 2026-08-13 (Fase 1 do Cronograma de Deploy concluída)

---

## 🎯 Foco Imediato

Com o ambiente de testes configurado e validado, o foco agora é **aumentar a cobertura de testes** das regras de negócio críticas.

### ✅ 1. (P0 - Crítico) Configurar Ambiente de Testes
- **O quê:** Configurar `Vitest` e `@testing-library/react` para o workspace `app-admin`.
- **Por quê:** Para criar uma rede de segurança que previna regressões e permita refatorações e novas features com mais confiança.
- **Status:** ✅ **CONCLUÍDO (2026-08-13).** `npm test` está funcional.

### 🚀 2. (P1 - Alto) Escrever Testes de Regra de Negócio
- **O quê:** Uma vez que o ambiente de testes esteja funcional, criar testes para as lógicas mais críticas.
- **Sugestões:**
    - Testar a lógica de cálculo de preço na `PrecificacaoPage`.
- **Status:** **Pronto para iniciar.**

---

##  backlog de Features e Melhorias (Pós-Testes)

Esta lista é baseada nas issues abertas e nas necessidades identificadas.

### Milestone `M0: Higiene, Seguranca e Deploy`
- **#13 - Corrigir path de deploy:** Embora o deploy esteja funcionando, esta issue pode se referir a uma otimização no `vercel.json` ou na estrutura de pastas que ainda pode ser necessária. Requer análise.

### Milestone `M3: Fases 3 e 4 - Qualidade, Testes e Deploy`
- **#19 - Atualizar `SECURITY.md`:** Criar um `SECURITY.md` que descreva a política de vulnerabilidades do projeto, contatos de segurança, etc.
- **#20 - Testes de isolamento de tenant:** Este é um teste de integração de alta prioridade que deve ser feito assim que o ambiente de testes estiver pronto. Ele precisa provar que um usuário do Tenant A não pode, de forma alguma, acessar dados do Tenant B.
- **Firestore Rules:** Documentar e versionar o arquivo `firestore.rules`.
- **Rate Limiting e CORS:** Implementar `rate limiting` na API para prevenir abuso e revisar a política de CORS para ser mais restritiva em produção.

### Novas Funcionalidades (Backlog Geral)
- **Melhorar cálculo de "Pedidos Hoje":** A refatoração do dashboard deixou este KPI zerado. Uma nova Cloud Function agendada pode ser criada para calcular isso de forma eficiente.
- **Refinar `NeonStudio`:** A tipagem deste componente ainda tem pontos de melhoria (`setActiveSupplierRules` como `any`).
- **Expandir Relatórios:** Criar novos relatórios úteis para o negócio (ex: produtos mais vendidos, etc.).
- **Migração para NestJS:** Planejar e executar a migração do backend para NestJS + Postgres, conforme a visão de longo prazo.