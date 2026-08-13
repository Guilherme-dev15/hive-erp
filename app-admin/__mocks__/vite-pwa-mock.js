// C:\www\HivePratas\app-admin\__mocks__\vite-pwa-mock.js
// Retorna um componente React vazio ou um objeto mock, dependendo do que o código espera.
// Para `useRegisterSW`, geralmente é um objeto com funções mockadas.
module.exports = {
  useRegisterSW: () => ({
    offlineReady: [false, () => {}],
    needRefresh: [false, () => {}],
    updateServiceWorker: () => {},
  }),
};
