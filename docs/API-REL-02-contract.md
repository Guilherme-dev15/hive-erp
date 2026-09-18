# API-REL-02 — Contrato do catálogo

> Documento de diagnóstico. Registra o contrato observado no cliente e a API disponível; não autoriza a abertura de endpoints públicos.

## Escopo

O catálogo (`app-catalogo`) aponta, por padrão, para `https://hiveerp-api.vercel.app` e usa as operações abaixo. A API NestJS atual usa rotas versionadas em `/api/v2` e autenticação Firebase nos módulos administrativos.

| Operação | Método | Rota usada pelo catálogo | Entrada observada | Situação na API NestJS |
| --- | --- | --- | --- | --- |
| Resolver loja | GET | `/config-by-slug` | `params: { slug }` | Nenhuma rota equivalente identificada |
| Produtos públicos | GET | `/products-public` | `params: { storeId }` | `/api/v2/products` existe, mas é protegido e tenant-scoped |
| Configuração pública | GET | `/config-public` | `params: { storeId }` | `/api/v2/config` existe, mas é protegido e tenant-scoped |
| Categorias públicas | GET | `/categories-public` | `params: { storeId }` | Nenhuma rota/controller público identificado |
| Salvar pedido | POST | `/orders` | `OrderPayload` | `/api/v2/orders` é protegido e usa DTO diferente |
| Validar cupom | POST | `/validate-coupon` | `{ code, storeId }` | Nenhuma rota pública equivalente; `/api/v2/coupons` é protegido |
| Criar pagamento | POST | `/create-payment-intent` | `{ amount, storeId }` | Somente webhook `/api/v2/payments/webhook`; adapter real não configurado |

As situações acima são fatos observados no código atual. A disponibilidade histórica das rotas legadas não foi considerada contrato oficial.

## Fluxo efetivamente usado

`app-catalogo/src/App.tsx` usa `fetchStoreBySlug(slug)` quando a URL contém `?loja=` ou `?slug=`, depois chama `fetchCatalogData(storeId)`, que carrega produtos, configuração e categorias em paralelo.

`saveOrder`, `checkCoupon` e `createPaymentIntent` estão exportadas por `src/services/api.ts`, mas não possuem call-site no fluxo atual identificado.

## Divergência do pedido

O catálogo envia itens com `id` e `quantidade`, além de `storeId` e `status` no nível superior. O DTO NestJS atual espera:

- `productId` opcional, não `id`;
- `quantity` obrigatório, não `quantidade`;
- campos declarados pelo DTO, sem `storeId`;
- `status`, quando presente, deve ser um valor de `OrderStatus`;
- `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted` e `transform`.

Logo, trocar apenas `/orders` por `/api/v2/orders` não é uma correção válida: o pedido não possui o mesmo contrato e a rota exige autenticação.

## Decisão de segurança pendente

Para suportar catálogo público por `slug` ou `storeId`, a API precisa de endpoints públicos próprios com isolamento de tenant, validação de identificador e resposta mínima. Não se deve reutilizar endpoints administrativos protegidos nem confiar em `storeId` enviado pelo cliente sem autorização server-side.

A definição desses endpoints e do contrato de resposta fica para uma etapa posterior, depois de revisão de produto e segurança. Esta etapa não altera rotas, cliente ou produção.

## Referências de código

- `app-catalogo/src/services/api.ts`
- `app-catalogo/src/App.tsx`
- `app-catalogo/src/types/index.ts`
- `nest-api/src/orders/dto/create-order.dto.ts`
- `nest-api/src/orders/orders.controller.ts`
- `nest-api/src/products/products.controller.ts`
- `nest-api/src/config/config.controller.ts`
- `nest-api/src/auth/auth.guard.ts`
- `nest-api/src/serverless.ts`
