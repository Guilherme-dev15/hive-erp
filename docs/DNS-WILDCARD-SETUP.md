# Guia de Configuração de Subdomínios Wildcard no HiveERP

> **Objetivo:** Permitir que cada lojista do HiveERP tenha sua vitrine pública com isolamento visual e marca própria em seu próprio subdomínio exclusivo (ex: `https://pratas.seudominio.com.br` ou `https://joias.seudominio.com.br`) com certificado SSL (HTTPS) emitido e renovado automaticamente pela Vercel.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Cliente / Comprador Final                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       https://pratas.seudominio.com.br (Subdomínio Wildcard)
                                    │
                                    ▼
         DNS CNAME (*.seudominio.com.br -> cname.vercel-dns.com)
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ Projeto Vercel: hiveerp-catalogo                        │
       │ - React 19 + Vite (PWA)                                 │
       │ - extractSlugFromLocation(): extrai "pratas"            │
       │ - Renderiza catálogo filtrado com produtos do lojista   │
       └─────────────────────────────────────────────────────────┘
                                    │
                     CORS (Origin: https://pratas.seudominio.com.br)
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ Projeto Vercel: hive-erp (API Serverless)               │
       │ - NestJS + Prisma ORM + PostgreSQL                      │
       │ - serverless-cors: valida https://*.seudominio.com.br   │
       │ - GET /api/v1/public/catalog?slug=pratas                │
       └─────────────────────────────────────────────────────────┘
```

---

## 2. Passo a Passo Técnico

### Passo 1: Aquisição do Domínio Base
- Para domínios nacionais (`.com.br`):
  - Acesse [Registro.br](https://registro.br).
  - Custo médio: R$ 40,00/ano.
  - Exemplos de nomes: `hivevitrines.com.br`, `lojashive.com.br`, `meucatalogo.top`.
- Para domínios globais (`.com` ou `.store`):
  - Cloudflare Registrar, Namecheap ou Porkbun.

---

### Passo 2: Configuração no Dashboard da Vercel

1. Acesse o painel da **Vercel** e abra o projeto do catálogo: `hiveerp-catalogo`.
2. Navegue até **Settings** > **Domains**.
3. Adicione o domínio Wildcard:
   ```text
   *.seudominio.com.br
   ```
4. Adicione também o domínio raiz (Apex) para redirecionamento ou página inicial da plataforma:
   ```text
   seudominio.com.br
   ```
5. A Vercel exibirá as instruções com os registros DNS necessários para validação de posse e emissão do certificado SSL.

---

### Passo 3: Configuração da Zona de DNS (Registro.br / Cloudflare)

No painel de gerenciamento de DNS do seu provedor de domínio (ex: Registro.br no modo DNS Próprio, ou Cloudflare):

| Tipo | Nome / Host | Valor / Destino | TTL | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `*` | `cname.vercel-dns.com.` | 1 hora / Automático | Roteia qualquer subdomínio para a Vercel |
| **A** | `@` | `76.76.21.21` | 1 hora / Automático | Aponta o domínio raiz para a Vercel |
| **TXT** | `_vercel` | `vc-domain-verify=...` *(fornecido pela Vercel)* | 1 hora | Validação de posse do domínio |

> **Nota para Cloudflare:** Se gerenciar a zona DNS pela Cloudflare, deixe as nuvens de proxy em **DNS Only (cinza)** inicialmente para permitir que a Vercel valide o desafio ACME e emita o certificado Let's Encrypt diretamente.

---

### Passo 4: Variáveis de Ambiente no Vercel Dashboard

Para que o monorepo opere em perfeita sintonia nos subdomínios, configure as seguintes variáveis de ambiente:

#### 1. Projeto `hive-erp` (Backend NestJS + Admin):
- `ALLOWED_ORIGINS`:
  ```text
  https://hive-erp.vercel.app,https://hiveerp-catalogo.vercel.app,https://*.seudominio.com.br,https://seudominio.com.br,http://localhost:5173
  ```
- `VITE_CATALOG_BASE_DOMAIN`:
  ```text
  seudominio.com.br
  ```

#### 2. Projeto `hiveerp-catalogo` (Vitrine Pública):
- `VITE_API_URL`:
  ```text
  https://hive-erp.vercel.app
  ```
- `VITE_CATALOG_BASE_DOMAIN`:
  ```text
  seudominio.com.br
  ```

---

## 3. Comportamento e Fallbacks do Sistema

1. **Acesso com Subdomínio (`https://hive.seudominio.com.br`):**
   - O `extractSlugFromLocation` detecta instantaneamente `hive`.
   - O slug possui precedência máxima e imutável (impossível injetar `?loja=outra` para sequestrar visualmente a vitrine).
   - O endereço na barra de navegação permanece limpo: `https://hive.seudominio.com.br/`.

2. **Acesso no Domínio Compartilhado (`https://hiveerp-catalogo.vercel.app/hive`):**
   - Continua funcionando perfeitamente sem nenhuma interrupção (retrocompatibilidade 100%).
   - Se acessado com `?loja=hive`, o sistema normaliza automaticamente para a clean URL `/hive`.

3. **Subdomínios Reservados:**
   - Subdomínios de sistema (`www`, `app`, `admin`, `api`, `catalogo`, `status`, `mail`, etc.) são ignorados como slugs de loja, prevenindo falsos positivos ou colisões operacionais.

---

## 4. Roteiro de Validação Pós-Apontamento (Smoke Test)

Após a propagação do DNS (geralmente de 5 minutos a 2 horas):

1. **Checagem de DNS no terminal:**
   ```bash
   nslookup teste.seudominio.com.br
   # Deve responder cname.vercel-dns.com ou IP da Vercel
   ```
2. **Checagem de SSL:**
   - Acesse `https://hive.seudominio.com.br` no navegador.
   - Verifique o cadeado de segurança (certificado Let's Encrypt emitido para `*.seudominio.com.br`).
3. **Checagem de CORS e Catálogo:**
   - Abra o Console do Desenvolvedor (F12) > Aba **Network**.
   - Verifique se a requisição para `https://hive-erp.vercel.app/api/v1/public/catalog?slug=hive` responde HTTP `200 OK` com o cabeçalho:
     ```text
     Access-Control-Allow-Origin: https://hive.seudominio.com.br
     ```
4. **Checagem no Admin:**
   - No Admin (`https://hive-erp.vercel.app`), clique no botão **"Ver Catálogo"** na Topbar e Sidebar.
   - O link deve direcionar diretamente para `https://{seu-slug}.seudominio.com.br`.
