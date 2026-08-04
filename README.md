# Hive ERP - Catálogo Online & Sistema de Gestão

O Hive ERP é uma solução completa para gestão de e-commerce, composta por um backend em Node.js (Express), um painel administrativo (`app-admin`) e um catálogo de produtos para o cliente final (`app-catalogo`), ambos construídos com React e TypeScript.

## 🚀 Arquitetura (Monorepo)

- `api/`: Backend em Node.js e Express, conectado ao Firebase (Firestore, Auth, Storage).
- `app-admin/`: Painel administrativo em React + TypeScript + Vite.
- `app-catalogo/`: Vitrine de produtos (catálogo online) em React + TypeScript + Vite.

## ⚙️ Setup do Ambiente Local

### Pré-requisitos
- Node.js (versão 20.x ou superior)
- npm (v7+ que suporta workspaces)

### 1. Instalação
Como este é um monorepo, basta executar o comando de instalação na raiz do projeto.

```bash
npm install
```

### 2. Variáveis de Ambiente (.env)
Você precisará criar arquivos `.env` para cada workspace (`api`, `app-admin`, `app-catalogo`) com as credenciais apropriadas do Firebase. Consulte os arquivos `.env.example` em cada pasta para a lista de variáveis necessárias.

## 🏃‍♀️ Rodando a Aplicação

Você precisará de 2 ou 3 terminais abertos.

1.  **Terminal 1 (Backend - Obrigatório):**
    ```bash
    # Na raiz do projeto
    npm run start --workspace=api
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
  npm run lint:check
  ```
- **Formatar todo o código:**
  ```bash
  npm run format
  ```

## 🧪 Testes

A configuração de testes automatizados com Jest está pendente e será implementada em uma fase futura.
