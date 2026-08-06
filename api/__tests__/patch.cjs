// Este arquivo é CommonJS (.cjs) para garantir compatibilidade com require().

// Intercepta a busca pelo módulo 'firebase-admin' e injeta nossa versão mockada no cache do Node.js.
// Isso é executado antes dos testes rodarem, manipulando o resolvedor nativo do Node.

const path = require('path');

// Resolve o caminho absoluto para o nosso arquivo de mock CommonJS.
const mockPath = path.resolve(__dirname, '..', '__mocks__', 'firebase-admin.cjs');

// Carrega o nosso objeto mockado.
const mockAdmin = require(mockPath);

// Injeta o mock no cache do require do Node.js.
// Quando o código em api/src/config/firebase.js chamar `require('firebase-admin')`,
// o Node.js vai retornar este mock em vez do pacote real em node_modules.
require.cache[require.resolve('firebase-admin', { paths: [path.resolve(__dirname, '..')] })] = {
  id: 'firebase-admin',
  filename: 'firebase-admin',
  loaded: true,
  exports: mockAdmin,
};
