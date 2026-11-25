import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { Role } from '@prisma/client';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Garante que o usuario logado eh um OWNER
   */
  private async ensureOwner(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.OWNER) {
      throw new ForbiddenException('Apenas o dono da loja pode gerenciar a equipe');
    }
    return user;
  }

  async getMembers(userId: string) {
    const owner = await this.ensureOwner(userId);
    // Contencao multitenant (Regra 4): enquanto User nao possuir storeId/ownerId dedicado,
    // listamos exclusivamente o proprio proprietario autenticado sem expor legacyId ou terceiros.
    return [
      {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        active: owner.active,
        createdAt: owner.createdAt,
      },
    ];
  }

  async inviteMember(_dto: InviteMemberDto, ownerId: string) {
    await this.ensureOwner(ownerId);
    throw new ForbiddenException(
      'Gestão multi-usuário por loja está temporariamente desabilitada até a ativação do vínculo por loja.',
    );
  }

  private safeDecodeEmail(rawEmail: string): string {
    try {
      return decodeURIComponent(rawEmail);
    } catch {
      return rawEmail;
    }
  }

  async removeMember(email: string, ownerId: string) {
    const owner = await this.ensureOwner(ownerId);
    const normalizedEmail = this.safeDecodeEmail(email).trim().toLowerCase();

    if (normalizedEmail === owner.email.trim().toLowerCase()) {
      throw new BadRequestException('Nao e possivel deletar o dono da loja');
    }

    throw new NotFoundException('Usuario nao encontrado no escopo desta loja');
  }
}
