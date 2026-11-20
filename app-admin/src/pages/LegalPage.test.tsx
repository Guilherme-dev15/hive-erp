import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LegalPage } from './LegalPage';

describe('LegalPage', () => {
  it('renderiza Termos de Uso com menção ao trial, cancelamento e responsabilidades', () => {
    render(
      <LegalPage
        document="terms"
        onNavigate={vi.fn()}
        onGoToApp={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Termos de Uso/i,
    );
    expect(screen.getByText(/14 \(quatorze\) dias/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Setup Assistido/i).length).toBeGreaterThan(0);
  });

  it('renderiza Política de Privacidade alinhada à LGPD (Lei 13.709/2018)', () => {
    render(
      <LegalPage
        document="privacy"
        onNavigate={vi.fn()}
        onGoToApp={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Política de Privacidade/i,
    );
    expect(screen.getAllByText(/13\.709\/2018/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Direitos do Titular/i)).toBeInTheDocument();
  });

  it('permite alternar entre Termos e Privacidade e voltar ao painel', () => {
    const onNavigate = vi.fn();
    const onGoToApp = vi.fn();
    render(
      <LegalPage
        document="terms"
        onNavigate={onNavigate}
        onGoToApp={onGoToApp}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Política de Privacidade/i }));
    expect(onNavigate).toHaveBeenCalledWith('/privacidade');

    fireEvent.click(screen.getByRole('button', { name: /Acessar Painel/i }));
    expect(onGoToApp).toHaveBeenCalledTimes(1);
  });
});
