# Cronograma do Projeto HiveERP

Este cronograma define as próximas etapas para o desenvolvimento do projeto HiveERP, com base no estado atual documentado. As tarefas estão priorizadas para resolver bloqueios e discrepâncias antes de iniciar novas funcionalidades.

## Backlog Priorizado

- [x] **Resolver Discrepâncias:** Localizar o repositório do projeto HiveERP, validar o estado do Git e documentar o caminho canônico no arquivo `ESTADO-ATUAL.md`.
- [x] **Implementar Melhorias de Segurança:** Iniciar a implementação de proteções essenciais, como isolamento de *tenants*, `rate limiting` e configuração de políticas de CORS.
- [x] **Configurar Testes (Crítico):** Configurar o ambiente de testes automatizados com Vitest e React Testing Library (RTL) para a aplicação `app-admin`.
- [x] **Desenvolver Testes Iniciais:** Criar os primeiros testes unitários (como o de formatadores) para as regras de negócio mais críticas do `app-admin`.
- [ ] **Desenvolver Funcionalidades do Backlog:** Retomar o desenvolvimento de novas funcionalidades, começando pela correção de KPIs e criação de novos relatórios.
- [ ] **Planejar Migração do Backend:** Avaliar e planejar a migração de longo prazo do backend para a arquitetura com NestJS e Postgres.
