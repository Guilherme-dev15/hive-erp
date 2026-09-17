# Hive ERP - Catálogo Online & Sistema de Gestão

O Hive ERP é um monorepo com uma API NestJS + Prisma + PostgreSQL em `nest-api`, um painel administrativo (`app-admin`) e um catálogo de produtos (`app-catalogo`), ambos construídos com React, TypeScript e Vite. A autenticação Firebase e a migração legada Firebase → PostgreSQL continuam fazendo parte do sistema.

## 🚀 Arquitetura (Monorepo)

- `api/`: Adapters CommonJS para servir a API NestJS como funções da Vercel.
- `nest-api/`: API em NestJS, com Prisma e PostgreSQL; a autenticação usa Firebase.
- `app-admin/`: Painel administrativo em React + TypeScript + Vite.
- `app-catalogo/`: Vitrine de produtos em React + TypeScript + Vite.

## ⚙️ Setup do Ambiente Local

### Pré-requisitos
- Node.js (versão 20.x ou superior)
- npm (v7+ que suporta workspaces)
- Docker, caso o PostgreSQL seja executado localmente

### 1. Instalação
Como este é um monorepo, execute o comando de instalação na raiz do projeto.

```bash
npm ci
```

### 2. Variáveis de Ambiente (.env)
Preencha os arquivos `.env` conforme os exemplos existentes em `app-admin/.env.example` e `app-catalogo/.env.example`. Para executar a API localmente, configure também `DATABASE_URL` no ambiente do workspace `nest-api`.

## 🏃‍♀️ Rodando a Aplicação

Você precisará de 2 ou 3 terminais abertos.

1. **Terminal 1 (API - Obrigatório):**
   ```bash
   cd nest-api
   docker compose up -d
   npx prisma generate
   npx prisma migrate dev
   npm run start:dev
   ```

2.  **Terminal 2 (Admin - Opcional):**
    ```bash
    # Na raiz do projeto
    npm run dev:admin
    ```

3.  **Terminal 3 (Catálogo - Opcional):**
    ```bash
    # Na raiz do projeto
    npm run dev:catalogo
    ```

## ✅ Qualidade de Código

O projeto está configurado com ESLint e Prettier para garantir a consistência e a qualidade do código.

- **Verificar erros de lint:**
  ```bash
  npm run lint
  ```
- **Formatar todo o código:**
  ```bash
  npm run format
  ```
- **Validar o pacote da Vercel após o build:**
  ```bash
  npm run build:vercel
  npm run verify:vercel-package
  ```

## 🧪 Testes

Os testes da raiz usam Vitest, e a API NestJS mantém suítes unitárias e E2E com Jest.

- **Testes Vitest:**
  ```bash
  npm test
  npm run test:api
  npm run test:ui
  ```
- **Testes NestJS:**
  ```bash
  npm run test --workspace=nest-api
  npm run test:e2e --workspace=nest-api
  ```

Os testes E2E exigem PostgreSQL disponível e `DATABASE_URL` configurada.
