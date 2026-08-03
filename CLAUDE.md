# Diretrizes do Projeto: HivePratas

Este documento define as principais diretrizes técnicas para o desenvolvimento do HivePratas ERP.

## Arquitetura e Stack Tecnológica

A stack oficial do projeto para o desenvolvimento atual (MVP / M2) é:

*   **Back-end:** Express.js com JavaScript.
*   **Banco de Dados:** Firebase Firestore.
*   **Front-end (Admin):** React com Vite.

**Visão de Longo Prazo:** Está planejado para o futuro (M3+) uma migração do back-end para uma arquitetura mais robusta com NestJS e um banco de dados relacional (PostgreSQL) para suportar a complexidade crescente de um ERP.

## Pagamentos

O fluxo de pagamentos para o MVP será manual (ex: PIX, transferência), sem integração com gateways de pagamento automatizados.

## Padrões de Código

*   **Commits:** Utilizar o padrão [Conventional Commits](https://www.conventionalcommits.org/). (Ex: `feat:`, `fix:`, `chore:`, `docs:`).
*   **Segurança:** Todas as chaves, tokens e segredos devem ser gerenciados através de variáveis de ambiente (`.env`) e nunca versionados no Git.
