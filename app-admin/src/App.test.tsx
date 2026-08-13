import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Mock do componente ProtectedLayout para isolar o teste do App
vi.mock('./layouts/ProtectedLayout', () => ({
  ProtectedLayout: () => <div>Mocked Protected Layout</div>,
}));

// Mock para o Toaster, que pode interferir com o snapshot
vi.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster-mock" />,
}));


describe('App', () => {
  it('deve renderizar os provedores e o layout mockado sem quebrar', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Usa waitFor para aguardar o conteúdo assíncrono aparecer
    await waitFor(() => {
      expect(screen.getByText('Mocked Protected Layout')).toBeInTheDocument();
    });

    // A verificação do Toaster pode ser síncrona, pois ele não depende de estado assíncrono
    expect(screen.getByTestId('toaster-mock')).toBeInTheDocument();
  });
});
