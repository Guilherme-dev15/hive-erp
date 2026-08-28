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
  }

  async getMembers(userId: string) {
    await this.ensureOwner(userId);
    // Para simplificar, trazemos todos por enquanto. O ideal no modelo B2B multi-store
    // eh que os usuarios tenham o storeId, mas o MVP de multitenant via legacyId ainda ta solto pro Firebase.
    // Vamos listar apenas o user atual por definicao de seguranca caso o MVP so tenha 1 user.
    return this.prisma.user.findMany({
       where: { role: Role.SELLER }
    });
  }

  async inviteMember(dto: InviteMemberDto, ownerId: string) {
    await this.ensureOwner(ownerId);

    // Converte o email pra minusculo (comportamento do React EquipePage:73)
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new BadRequestException('E-mail ja cadastrado na plataforma');
    }

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: normalizedEmail,
        role: Role.SELLER,
        active: true
        // O Firebase UID (legacyId) sera populado num fluxo de Signup posterior ou Auth0
      }
    });
  }

  async removeMember(email: string, ownerId: string) {
    await this.ensureOwner(ownerId);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    if (user.role === Role.OWNER) {
       throw new BadRequestException('Nao e possivel deletar o dono da loja');
    }

    return this.prisma.user.delete({ where: { email } });
  }
}
