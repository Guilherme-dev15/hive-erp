# API-REL-02 — Contrato do catálogo

> Contrato de release do catálogo público v1. A implementação exige validação de testes, ambiente e Preview; não autoriza promoção automática para produção.

## Escopo

O catálogo (`app-catalogo`) usa `VITE_API_URL` para apontar à API NestJS do ambiente correspondente. Em Preview, API/Admin e catálogo são deployables separados. A API NestJS também mantém rotas versionadas em `/api/v2` e autenticação Firebase nos módulos administrativos.

As rotas legadas abaixo são mantidas apenas como registro da divergência auditada. Não são compatibilidade suportada e o fallback `hiveerp-api.vercel.app` não deve ser usado.

| Operação | Método | Rota histórica | Entrada observada | Situação |
| --- | --- | --- | --- | --- |
| Resolver loja | GET | `/config-by-slug` | `params: { slug }` | Legado, não suportado |
| Produtos/config/categorias | GET | `/products-public`, `/config-public`, `/categories-public` | `storeId` | Legado, não suportado |
| Pedido/cupom/pagamento | POST | `/orders`, `/validate-coupon`, `/create-payment-intent` | payload legado | Fora do contrato público v1 |

Apenas a rota pública v1 documentada abaixo deve ser usada.

## Fluxo efetivamente usado

`app-catalogo/src/App.tsx` extrai `loja` ou `slug` da URL e chama `fetchCatalogData(slug)`. O cliente faz uma única requisição à API pública para carregar configuração, produtos e categorias. Links baseados apenas em `storeId` não são compatíveis.

Pedidos, cupons e pagamentos continuam fora do fluxo público v1. As funções legadas eventualmente exportadas pelo cliente não possuem call-site público aprovado e não devem ser reativadas sem novo contrato.

## Contrato público v1 implementado

A rota pública canônica é:

```text
GET /api/v1/public/catalog?slug=<slug>
```

O slug é resolvido no servidor pela coluna única `configs.public_slug`, com `User.active = true`. O navegador não envia nem escolhe `storeId`, `userId`, `Origin` ou `Referer` como identidade do tenant. O campo `storeId` é rejeitado pelo contrato público.

A resposta bem-sucedida é um envelope atômico e versionado:

```json
{
  "version": "v1",
  "data": {
    "config": {
      "storeName": "Minha Loja",
      "slug": "minha-loja",
      "primaryColor": "#D4AF37",
      "secondaryColor": "#343434",
      "whatsappNumber": null,
      "banners": [],
      "lowStockThreshold": 5
    },
    "produtos": [],
    "categorias": []
  }
}
```

Regras de resposta:

- somente produtos `ATIVO` do tenant resolvido;
- `Decimal` vira número JSON e o status vira `ativo`;
- variantes são mapeadas para `sku_sufixo`, `valor_ajuste`, `medida`, `estoque` e `sob_consulta`;
- `categorias` e nomes de categoria são filtrados pelo mesmo `userId` resolvido;
- `userId`, `storeId`, custos, margens, fornecedores, timestamps administrativos, pedidos, cupons e pagamentos nunca são expostos;
- `Cache-Control: no-store` nesta primeira versão;
- slug ausente, não canônico ou inválido: `400`;
- slug desconhecido ou tenant inativo: `404`;
- falha de dependência: erro de disponibilidade, sem fallback para catálogo vazio.

Pedidos, cupons e pagamentos permanecem fora do contrato público v1. O adapter de pagamento continua fail-closed.

## Divergência do pedido legado

O catálogo legado enviava itens com `id` e `quantidade`, além de `storeId` e `status` no nível superior. O DTO NestJS administrativo espera contrato diferente, incluindo `productId`/`quantity`, e exige autenticação. Portanto, trocar apenas `/orders` por `/api/v2/orders` não é uma correção válida.

## Deployment e gates

O projeto raiz executa `npm run build:vercel`, que gera `nest-api/dist` e `app-admin/dist`. `api/index.js` e `api/[...path].js` carregam o handler compilado, e as rotas `/api/(.*)` precedem o fallback SPA. O catálogo é construído e publicado separadamente pelo projeto Vercel `hiveerp-catalogo`; seu build recebe `VITE_API_URL` como variável de build.

O verificador `scripts/verify-vercel-package.mjs` valida artefatos, adapters, `includeFiles` e ordem de roteamento, mas não substitui teste HTTP/runtime.

Antes de qualquer promoção, são obrigatórios:

- testes NestJS unitários/E2E e testes Vitest do catálogo;
- build do NestJS, Admin e catálogo;
- verificação de `nest-api/dist/serverless.js`;
- Preview separado da API/Admin e do catálogo;
- banco de Preview com `public_slug`, tenant ativo, produtos ativos e categorias não produtivos;
- smoke HTTP/browser da rota v1, CORS/OPTIONS, deep link, slug desconhecido e isolamento multitenant;
- ausência de `FUNCTION_INVOCATION_FAILED`/5xx nos logs.

## Referências de código

- `app-catalogo/src/services/api.ts`
- `app-catalogo/src/App.tsx`
- `app-catalogo/src/types/index.ts`
- `nest-api/src/public-catalog/public-catalog.controller.ts`
- `nest-api/src/public-catalog/public-catalog.service.ts`
- `nest-api/src/public-catalog/public-catalog.mapper.ts`
- `nest-api/src/public-catalog/public-catalog.types.ts`
- `nest-api/src/serverless.ts`
- `vercel.json`
- `scripts/verify-vercel-package.mjs`
