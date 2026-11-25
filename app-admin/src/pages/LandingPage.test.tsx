import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renderiza proposta de valor, planos e call-to-action de 14 dias grátis', () => {
    render(<LandingPage onStartTrial={vi.fn()} onNavigate={vi.fn()} />);

    expect(screen.getAllByText(/HIVE ERP/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Venda, controle o estoque e emita nota fiscal/i,
    );
    expect(screen.getAllByText(/14 dias grátis/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/R\$\s*97/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/até 200 produtos/i)).toBeInTheDocument();
    expect(screen.getByText(/até 300 produtos/i)).toBeInTheDocument();
    expect(screen.getByText(/até 500 produtos/i)).toBeInTheDocument();
  });

  it('aciona onStartTrial ao clicar nos botões de entrada ou teste grátis', () => {
    const onStartTrial = vi.fn();
    render(<LandingPage onStartTrial={onStartTrial} onNavigate={vi.fn()} />);

    const buttons = screen.getAllByRole('button', { name: /Começar 14 dias grátis/i });
    fireEvent.click(buttons[0]);
    expect(onStartTrial).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Entrar no Painel/i }));
    expect(onStartTrial).toHaveBeenCalledTimes(2);
  });

  it('exibe links legais de Termos de Uso e Política de Privacidade (LGPD)', () => {
    const onNavigate = vi.fn();
    render(<LandingPage onStartTrial={vi.fn()} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: /Termos de Uso/i }));
    expect(onNavigate).toHaveBeenCalledWith('/termos');

    fireEvent.click(screen.getByRole('button', { name: /Política de Privacidade/i }));
    expect(onNavigate).toHaveBeenCalledWith('/privacidade');
  });
});
