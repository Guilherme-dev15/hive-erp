# Política de Segurança

## Versões suportadas

O projeto é mantido continuamente na branch `main`. Como ainda não há releases versionadas publicadas, correções de segurança são aplicadas à versão mais recente da branch principal.

| Versão | Suporte de segurança |
| --- | --- |
| `main` | ✅ Sim |
| Versões anteriores ou branches não mantidas | ❌ Não garantido |

## Como reportar uma vulnerabilidade

Não publique detalhes de uma vulnerabilidade em uma issue, pull request ou discussão pública.

O reporte deve ser feito por um canal privado do GitHub, sem publicar detalhes em uma issue, pull request ou discussão pública. O recurso de **GitHub Security Advisories** pode ser usado quando estiver habilitado para o repositório:

1. Acesse a aba **Security** do repositório.
2. Abra **Advisories**.
3. Selecione **Report a vulnerability**.
4. Inclua os detalhes técnicos necessários para reproduzir e corrigir o problema.

Se o reporte privado não estiver habilitado, entre em contato com a pessoa mantenedora do repositório por mensagem privada no GitHub e informe que se trata de um reporte de segurança. Não envie credenciais, tokens ou dados pessoais reais no primeiro contato; use valores mascarados ou um caso de reprodução mínimo.

Inclua, quando possível:

- descrição do impacto;
- passos para reprodução;
- versão, commit ou ambiente afetado;
- evidências mínimas, sem dados sensíveis;
- sugestão de correção, se disponível.

## Divulgação coordenada

- O reporte será tratado de forma confidencial durante a investigação.
- A confirmação, a correção e a divulgação pública devem ser coordenadas com a pessoa mantenedora do projeto.
- Não divulgue detalhes exploráveis antes de existir uma correção ou uma orientação acordada para mitigação.
- Após a correção, o crédito da pessoa pesquisadora será registrado se ela desejar e se isso não aumentar o risco para usuários.

## Segredos e credenciais

Nunca faça commit de:

- chaves, tokens ou configurações privadas do Firebase;
- arquivos de conta de serviço, como `serviceAccountKey.json`;
- senhas ou URLs privadas de conexão PostgreSQL;
- segredos de webhook ou credenciais de provedores externos;
- arquivos `.env` com valores reais.

Use variáveis de ambiente e os arquivos `.env.example` apenas para documentar nomes de variáveis, sem valores secretos. Se uma credencial for exposta, trate-a como comprometida: revogue ou rotacione-a, remova o valor do código e revise o histórico do repositório.

## Stack atual

- API: NestJS com Prisma e PostgreSQL.
- Autenticação: Firebase Auth.
- Interfaces: React, TypeScript e Vite em `app-admin` e `app-catalogo`.
- Deploy: Vercel, com adapters em `api/` para a API NestJS.

## Referências

- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/about-repository-security-advisories)
- [GitHub — Reportar uma vulnerabilidade](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/about-coordinated-disclosure-of-security-vulnerabilities)
