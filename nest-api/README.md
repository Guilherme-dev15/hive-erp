# Hive ERP - Prisma & PostgreSQL Migration

Este diretório \`nest-api\` contém a base estrutural para a migração dos dados do Firebase Firestore para o PostgreSQL, utilizando Prisma ORM.

## Estrutura
- \`prisma/schema.prisma\`: Contém o modelo de dados validado e formatado para o Postgres, resolvendo as entidades aninhadas (como \`variants\` ou \`orderItems\`) em tabelas relacionais com relacionamentos adequados e Mapeamento Transiente (\`legacy_id\`).
- \`prisma/migrations/0_init.sql\`: O schema de banco de dados gerado através de \`npx prisma migrate diff\`, contendo os comandos DDL a serem executados no servidor PostgreSQL alvo.
- \`migration-draft.js\`: Um rascunho de script em NodeJS (CommonJS) pronto para ser utilizado como base de ETL. O script contém loops para consultar os dados via \`firebase-admin\` (do antigo tenant) e gravar usando o cliente Prisma gerado.

## Próximos Passos
1. **Banco de Dados:** Suba uma instância Postgres (Docker, local, Supabase) e aponte no \`.env\`.
2. **Migrations:** Rode \`npx prisma migrate dev\` para aplicar as migrations ao banco de dados.
3. **ETL:** Forneça a \`serviceAccountKey.json\` do Firebase no diretório da API pai ou altere o caminho em \`migration-draft.js\` e execute \`node migration-draft.js\`.
