# Hive ERP - NestJS & PostgreSQL (API V2)

Este diretório `nest-api` contém a base para a nova API do Hive ERP. É o ambiente alvo da migração arquitetural do projeto (M3+).

## Estrutura

- `prisma/schema.prisma`: modelo de dados validado e formatado para PostgreSQL.
- `prisma/seed.ts`: fluxo canônico de ETL Firebase → PostgreSQL, executado apenas explicitamente e com credenciais externas.

## Status da Migração

Consulte `MIGRATION_PLAN.md` na raiz do Workspace AI (`C:\Users\Guilherme\ai-workspace\1_PROJECTS\hiveerp`) para detalhes sobre o planejamento de escrita dupla e virada de chave.

## Rodando localmente

1. Inicie apenas o PostgreSQL de desenvolvimento, quando necessário: `docker-compose up -d postgres`.
2. Gere o Prisma Client: `npx prisma generate`.
3. Para o banco de desenvolvimento, aplique o esquema conforme o fluxo local documentado: `npx prisma migrate dev`.
4. Para testes E2E com acesso real ao PostgreSQL, inicie o serviço dedicado: `docker-compose up -d postgres-e2e`. Ele usa a porta `55432`, o database `hive_erp_e2e` e volume separado do banco de desenvolvimento.
5. Configure `HIVE_E2E_DB_ENABLED=true` e `DATABASE_URL` apenas na sessão local. O destino permitido é PostgreSQL em loopback, porta `55432`, database `hive_erp_e2e`, usuário `hive_e2e`. O valor da senha não deve ser gravado no repositório nem impresso em logs.
6. Confirme o destino sem expor a URL e aplique as migrations explicitamente com `npx prisma migrate deploy`. O `test:e2e` não cria banco, não aplica migrations e não remove volumes.
7. Execute as suítes em série: `npm run test:e2e -- --runInBand`. O Jest valida o destino antes de importar as suítes; em produção, sem opt-in ou com alvo divergente, falha fechado antes da conexão Prisma.
8. Para testar somente o guard e a validação DTO sem abrir conexão com banco: `npm run test:e2e:safety`.

As suítes de inventário e transações limpam somente dados ligados aos IDs sintéticos delas. Isso não substitui o requisito de banco E2E dedicado. Não execute suítes com escrita em `mydb`, homologação ou produção. O volume E2E é persistente; não use `docker-compose down -v` como rotina de limpeza.

## Migração legada

Configure `DATABASE_URL` e uma credencial Firebase externa por `FIREBASE_SERVICE_ACCOUNT_JSON` ou `GOOGLE_APPLICATION_CREDENTIALS`. Execute primeiro o preflight sem escrita: `npm run migrate:legacy:dry-run`.

O fluxo canônico cobre usuários, categorias, fornecedores, produtos, pedidos e transações. Variantes, cupons, configurações e logs de estoque exigem uma etapa específica antes de serem migrados. Só execute `npm run migrate:legacy` em homologação, após backup e aprovação explícita. Nunca use o comando contra produção sem um plano de rollback.
