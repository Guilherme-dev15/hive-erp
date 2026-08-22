# Hive ERP - NestJS & PostgreSQL (API V2)

Este diretório `nest-api` contém a base para a nova API do Hive ERP. 
É o ambiente alvo da migração arquitetural do projeto (M3+).

## Estrutura
- `prisma/schema.prisma`: Contém o modelo de dados validado e formatado para o Postgres. Transfere os dados não relacionais para um esquema fortemente tipado.
- `migration-draft.js`: Script de ETL construído em CommonJS que conecta no Firebase Firestore (usando as chaves de `/serviceAccountKey.json`) e insere no PostgreSQL.

## Status da Migração
Consulte o arquivo `MIGRATION_PLAN.md` na raiz do Workspace AI (`C:\Users\Guilherme\ai-workspace\1_PROJECTS\hiveerp`) para detalhes sobre o planejamento de escrita dupla e virada de chave.

## Rodando Localmente
1. Certifique-se de que o Docker está rodando e execute: `docker-compose up -d`
2. Gere a tipagem do cliente Prisma: `npx prisma generate`
3. Aplique o esquema no banco (caso esteja limpo): `npx prisma migrate dev`
4. (Opcional) Teste o script de ETL conectando no Firebase: `node migration-draft.js`
