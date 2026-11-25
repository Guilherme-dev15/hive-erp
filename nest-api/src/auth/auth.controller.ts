import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from './auth.guard';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';

@Controller('api/v2/auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: body.email },
          ...(body.legacyId ? [{ legacyId: body.legacyId }] : []),
        ],
      },
    });

    if (existing) {
      return {
        message: 'Usuário já cadastrado',
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role === 'OWNER' ? 'admin' : 'viewer',
        },
      };
    }

    const trialDays = 14;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: Role.OWNER,
        active: true,
        trialEndsAt,
        legacyId: body.legacyId || null,
        config: {
          create: {
            storeName: body.storeName || 'Minha Loja Hive',
            primaryColor: '#F2A900',
            secondaryColor: '#2B2B2E',
            whatsappNumber: body.phone || null,
          },
        },
        dashboardStats: {
          create: {
            revenue: 0,
            totalOrders: 0,
          },
        },
      },
      include: {
        config: true,
      },
    });

    return {
      message: 'Conta criada com sucesso! 14 dias de teste gratuito liberados.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin',
        trialEndsAt: user.trialEndsAt,
      },
    };
  }

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
