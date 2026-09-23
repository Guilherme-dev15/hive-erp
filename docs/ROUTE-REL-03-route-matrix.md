# ROUTE-REL-03 — Matriz consolidada de rotas

> Estado de release atualizado após a implementação do contrato público v1. A matriz não autoriza promoção de produção; Preview, smoke e gates continuam obrigatórios.

## Catálogo público

| Fluxo | Call-site | Método/rota v1 | Auth/tenant | Implementação | Classificação |
| --- | --- | --- | --- | --- | --- |
| Resolver e carregar loja | `app-catalogo/src/App.tsx` → `fetchCatalogData` | `GET /api/v1/public/catalog?slug=...` | Sem AuthGuard; slug resolve `Config.publicSlug` + `User.active` server-side | `PublicCatalogController`/`PublicCatalogService` | **Implementado em código; validar Preview** |
| Listar produtos | envelope v1 `data.produtos` | Incluído na mesma resposta | Filtrado por `userId` resolvido e `status=ATIVO` | serializer público com `select` explícito | **Implementado em código; validar isolamento** |
| Ler configuração | envelope v1 `data.config` | Incluído na mesma resposta | Somente campos storefront; sem IDs internos | `mapPublicConfig` | **Implementado em código; validar payload** |
| Listar categorias | envelope v1 `data.categorias` | Incluído na mesma resposta | Categorias filtradas pelo tenant resolvido | `category.findMany` com `userId` + IDs referenciados | **Implementado em código; validar payload** |
| Salvar pedido | Sem call-site público | Nenhuma rota pública | Não habilitado | `/api/v2/orders` continua protegido e com DTO administrativo | **Futuro; não abrir agora** |
| Validar cupom | Sem call-site público | Nenhuma rota pública | Não habilitado | `/api/v2/coupons` continua protegido | **Futuro; não abrir agora** |
| Criar pagamento | Sem call-site público | Nenhuma rota pública | Não habilitado | Adapter fail-closed; apenas webhook interno | **Adiado por decisão de produto** |

### Contrato público v1

- Identificador aceito: `slug` com formato lowercase alfanumérico/hífen, 3–63 caracteres.
- `storeId`, `userId`, parâmetros extras e slug ausente/inválido não são caminhos de compatibilidade.
- A API não usa `Origin`, `Referer` ou `Host` para escolher o tenant.
- `400` para locator inválido; `404` para slug inexistente/tenant inativo.
- Produtos são somente `ATIVO`; preços/ajustes são números; status é lowercase.
- A resposta não contém custos, margens, fornecedores, IDs de tenant, pedidos, cupons ou pagamentos.
- `Cache-Control: no-store` até decisão explícita de cache/invalidação.

### Política de erro

`fetchCatalogData` não converte falhas em `[]`/`null`: uma falha HTTP ou envelope inválido chega ao estado “Loja indisponível”. Um catálogo vazio válido é distinguível de indisponibilidade pelo envelope v1 bem-sucedido.

O fallback `https://hiveerp-api.vercel.app` foi removido do fluxo ativo e não deve ser reativado.

## Admin → Nest

| Função em `app-admin/src/services/apiService.ts` | Método/rota | Controller Nest encontrado | Classificação |
| --- | --- | --- | --- |
| `getAdminProdutos` | `GET /api/v2/products` | ProductsController | Existente/protegida |
| `createAdminProduto` | `POST /api/v2/products` | ProductsController | Existente/protegida |
| `updateAdminProduto` | `PUT /api/v2/products/:id` | ProductsController | Existente/protegida |
| `deleteAdminProduto` | `DELETE /api/v2/products/:id` | Nenhum `DELETE` | Gap administrativo |
| `importProductsBulk` | `POST /api/v2/products/bulk` | Nenhum `bulk` genérico; existem `bulk-markup`/`bulk-status` | Contrato divergente |
| `getAdminOrders` | `GET /api/v2/orders` | OrdersController | Existente/protegida |
| `updateAdminOrderStatus` | `PATCH /api/v2/orders/:id/status` | OrdersController | Existente/protegida |
| `deleteAdminOrder` | `DELETE /api/v2/orders/:id` | Nenhum `DELETE` | Gap administrativo |
| `getTransacoes/createTransacao/deleteTransacao` | GET/POST/DELETE `/api/v2/transactions` | TransactionsController | Existente/protegida |
| `updateTransacao` | `PUT /api/v2/transactions/:id` | Nenhum `PUT` | Gap administrativo |
| suppliers/categories | `/api/v2/suppliers`, `/api/v2/categories` | Não há módulos no AppModule | Gap administrativo |
| coupons/config/dashboard/team/inventory | `/api/v2/...` | Módulos/controllers correspondentes | Validar DTOs individualmente |

As rotas administrativas permanecem separadas da API pública e não devem ser reutilizadas pelo catálogo.

## Deployment/runtime bloqueante

O projeto Vercel raiz precisa construir NestJS antes de empacotar `api/index.js`/`api/[...path].js`:

- `npm run build:vercel` gera `nest-api/dist` e `app-admin/dist`;
- `vercel.json` encaminha `/api/(.*)` antes do filesystem/fallback SPA;
- `includeFiles` inclui `nest-api/dist/**`, Prisma e clients gerados;
- `scripts/verify-vercel-package.mjs` impede build sem artefato ou adapters.

A implementação local ainda requer Preview para confirmar que o runtime e `DATABASE_URL` estão operacionais. Qualquer `FUNCTION_INVOCATION_FAILED`, erro Prisma/módulo, CORS inválido ou 5xx bloqueia a release.
