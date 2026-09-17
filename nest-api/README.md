# Hive ERP - NestJS & PostgreSQL (API V2)

Este diretório `nest-api` contém a base para a nova API do Hive ERP. 
É o ambiente alvo da migração arquitetural do projeto (M3+).

## Estrutura
- `prisma/schema.prisma`: Contém o modelo de dados validado e formatado para o Postgres. Transfere os dados não relacionais para um esquema fortemente tipado.
- `prisma/seed.ts`: Fluxo canônico de ETL Firebase → PostgreSQL, executado apenas de forma explícita e com credenciais externas.

## Status da Migração
Consulte o arquivo `MIGRATION_PLAN.md` na raiz do Workspace AI (`C:\Users\Guilherme\ai-workspace\1_PROJECTS\hiveerp`) para detalhes sobre o planejamento de escrita dupla e virada de chave.

## Rodando Localmente
1. Certifique-se de que o Docker está rodando e execute: `docker-compose up -d`
2. Gere a tipagem do cliente Prisma: `npx prisma generate`
3. Aplique o esquema no banco (caso esteja limpo): `npx prisma migrate dev`
4. Para executar a migração legada, configure `DATABASE_URL` e uma credencial Firebase externa por `FIREBASE_SERVICE_ACCOUNT_JSON` ou `GOOGLE_APPLICATION_CREDENTIALS`. Execute primeiro o preflight sem escrita: `npm run migrate:legacy:dry-run`.
5. Só execute `npm run migrate:legacy` em ambiente de homologação, após backup e aprovação explícita. Nunca use o comando contra produção sem um plano de rollback.
