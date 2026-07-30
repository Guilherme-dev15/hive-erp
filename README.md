# Hive ERP - Catálogo Online & Sistema de Gestão

O Hive ERP é uma solução completa para gestão de e-commerce, composta por um backend robusto em Node.js (Express), um painel administrativo (`app-admin`) e um catálogo de produtos para o cliente final (`app-catalogo`), ambos construídos com React e TypeScript.

## 🚀 Arquitetura

O projeto é um monorepo com 3 componentes principais:

-   `api/`: Backend em Node.js e Express, conectado ao Firebase (Firestore, Auth, Storage) para persistência de dados.
-   `app-admin/`: Painel administrativo em React + TypeScript + Vite para gestão de produtos, pedidos, finanças, etc.
-   `app-catalogo/`: Vitrine de produtos (catálogo online) para o cliente final, também em React + TypeScript + Vite.

## ⚙️ Setup do Ambiente Local

### Pré-requisitos
- Node.js (versão 20.x ou superior)
- npm

### 1. Instalação das Dependências

Execute `npm install` em cada um dos diretórios:

```bash
# Na raiz do projeto (para dependências compartilhadas)
npm install

# Para a API
cd api
npm install

# Para o painel administrativo
cd ../app-admin
npm install

# Para o catálogo
cd ../app-catalogo
npm install
```

### 2. Variáveis de Ambiente

#### Backend (`api/`)
Crie um arquivo `.env` dentro da pasta `api/` e preencha com as credenciais do Firebase (obtidas no seu console do Firebase):

```
FIREBASE_PROJECT_ID="seu-project-id"
FIREBASE_CLIENT_EMAIL="seu-client-email@...iam.gserviceaccount.com"
FIREBEASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Frontend (`app-admin/` e `app-catalogo/`)
Crie um arquivo `.env` dentro de `app-admin/` e outro em `app-catalogo/`. Consulte os arquivos `.env.example` em cada pasta para ver as variáveis necessárias, que devem começar com `VITE_`.

Exemplo para `app-admin/.env`:
```
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto-id"
# ... e as demais variáveis
```

## 🏃‍♀️ Rodando a Aplicação

Você precisará de 3 terminais abertos para rodar o ambiente completo.

1.  **Terminal 1 (Backend):**
    ```bash
    cd api
    npm start # Ou node index.js
    ```

2.  **Terminal 2 (Admin):**
    ```bash
    cd app-admin
    npm run dev
    ```

3.  **Terminal 3 (Catálogo):**
    ```bash
    cd app-catalogo
    npm run dev
    ```

## ✅ Rodando os Testes

Os testes de integração para a API estão configurados com Jest e Supertest.

Para rodar todos os testes:
```bash
cd api
npm test
```
