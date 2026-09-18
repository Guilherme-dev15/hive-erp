# ROUTE-REL-03 — Matriz consolidada de rotas

> Diagnóstico de release. Este documento não cria endpoints, não remapeia clientes e não autoriza publicar rotas públicas.

## Catálogo público

| Fluxo | Call-site | Método/rota atual | Auth/tenant observado | API Nest equivalente | Classificação |
| --- | --- | --- | --- | --- | --- |
| Resolver loja | `app-catalogo/src/App.tsx` → `fetchStoreBySlug` | `GET /config-by-slug?slug=...` | Pública presumida; resposta não confirmada | Nenhum | **Gap bloqueante** |
| Listar produtos | `App.tsx` → `fetchCatalogData` | `GET /products-public?storeId=...` | Pública presumida; `storeId` vem do cliente | `GET /api/v2/products`, AuthGuard + tenant por usuário | **Não reutilizar** |
| Ler configuração | `App.tsx` → `fetchCatalogData` | `GET /config-public?storeId=...` | Pública presumida; resposta não confirmada | `GET /api/v2/config`, AuthGuard + tenant por usuário | **Não reutilizar** |
| Listar categorias | `App.tsx` → `fetchCatalogData` | `GET /categories-public?storeId=...` | Pública presumida | Nenhum controller/módulo | **Gap bloqueante** |
| Salvar pedido | Export sem call-site no catálogo | `POST /orders` | Auth não definida no legado | `POST /api/v2/orders`, AuthGuard + DTO diferente | **Futuro; não abrir agora** |
| Validar cupom | Export sem call-site no catálogo | `POST /validate-coupon` | Pública presumida | `/api/v2/coupons`, AuthGuard | **Futuro; não abrir agora** |
| Criar pagamento | Export sem call-site no catálogo | `POST /create-payment-intent` | Pública presumida | Apenas webhook; adapter real fail-closed | **Adiado por decisão de produto** |

### Política de erro atual

`fetchCatalogData` captura cada erro e retorna `[]` para produtos/categorias ou `null` para configuração. Isso diferencia “sem dados” de “erro” apenas no código, não na interface do usuário. A remoção desse fallback silencioso depende da decisão de disponibilidade do catálogo e deve ser tratada junto com o contrato público.

O fallback de base URL `https://hiveerp-api.vercel.app` é legado e não deve ser tratado como disponibilidade comprovada.

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

A matriz administrativa não autoriza corrigir todos os gaps neste PR; eles devem ser priorizados por uso real e tratados em mudanças isoladas.

## Decisão bloqueante para a PUBLIC-CATALOG API

Antes de implementar qualquer endpoint público, produto/arquitetura deve escolher:

1. **Catálogo integrado:** endpoints públicos próprios na API NestJS, com tenant resolvido server-side por slug/domínio e resposta mínima; ou
2. **Catálogo separado:** backend público dedicado, com contrato, deploy e observabilidade próprios.

Em ambos os casos, são obrigatórios:

- validação de slug/domínio;
- resolução server-side do tenant;
- isolamento comprovado entre tenants;
- nenhum acesso público a rotas administrativas;
- payload/response versionados;
- pedidos e cupons explicitamente habilitados ou marcados como indisponíveis;
- gateway real mantido fora desta fase.

`storeId` fornecido diretamente pelo navegador não é prova de autorização e não deve ser usado sozinho para escolher dados de um tenant.
