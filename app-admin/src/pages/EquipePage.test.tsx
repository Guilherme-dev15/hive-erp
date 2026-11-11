import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquipePage } from './EquipePage';

const { mockGetTeamMembers, mockInviteTeamMember, mockRemoveTeamMember } = vi.hoisted(() => ({
  mockGetTeamMembers: vi.fn(),
  mockInviteTeamMember: vi.fn(),
  mockRemoveTeamMember: vi.fn(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    userData: { name: 'Proprietário Exemplo', role: 'admin', active: true },
  }),
}));

vi.mock('../services/apiService', () => ({
  getTeamMembers: mockGetTeamMembers,
  inviteTeamMember: mockInviteTeamMember,
  removeTeamMember: mockRemoveTeamMember,
}));

describe('EquipePage (Contenção Mono-Usuário)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeamMembers.mockResolvedValue([
      {
        id: 'uuid-owner',
        name: 'Proprietário Exemplo',
        email: 'owner@loja-exemplo.com',
        role: 'OWNER',
        active: true,
      },
    ]);
  });

  it('reconhece role admin como proprietário e exibe aviso de operação mono-usuário sem permitir convites', async () => {
    render(<EquipePage />);

    await waitFor(() => {
      expect(screen.getByText('Proprietário Exemplo')).toBeInTheDocument();
    });

    expect(screen.queryByText('Acesso Restrito')).not.toBeInTheDocument();
    expect(screen.getByText(/Operação Mono-Usuário Ativa/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Confirmar Acesso/i })).not.toBeInTheDocument();
  });
});
