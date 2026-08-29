import { Controller, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from './auth.guard';

@Controller('api/v2/auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    if (!req.user || (!req.user.id && !req.user.legacyId)) {
      throw new UnauthorizedException('Usuário inválido no contexto');
    }

    let dbUser;

    if (req.user.id) {
       dbUser = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    } else {
       dbUser = await this.prisma.user.findUnique({ where: { legacyId: req.user.legacyId } });
    }

    if (!dbUser) {
      throw new UnauthorizedException('Registro do usuário não encontrado no banco de dados da plataforma.');
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role === 'OWNER' ? 'admin' : (dbUser.role === 'SELLER' ? 'editor' : 'viewer'),
      active: dbUser.active
    };
  }
}
