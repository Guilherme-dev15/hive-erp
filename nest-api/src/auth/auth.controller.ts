import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from './auth.guard';
import { OnboardDto } from './dto/onboard.dto';
import { Role, Prisma } from '@prisma/client';

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

  @UseGuards(AuthGuard)
  @Post('onboard')
  async onboard(@Request() req: any, @Body() dto: OnboardDto) {
    const legacyId = req.user?.legacyId;
    const userId = req.user?.id;

    if (!legacyId && !userId) {
      throw new UnauthorizedException('Usuário inválido no contexto de autenticação');
    }

    const normalizedEmail = (dto.email || req.user?.email)?.trim().toLowerCase();

    let existingUser = null;
    if (userId) {
      existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { config: true },
      });
    } else if (legacyId) {
      existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { legacyId },
            ...(normalizedEmail
              ? [{ email: { equals: normalizedEmail, mode: 'insensitive' as const } }]
              : []),
          ],
        },
        include: { config: true },
      });
    }

    if (existingUser) {
      return {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role === 'OWNER' ? 'admin' : (existingUser.role === 'SELLER' ? 'editor' : 'viewer'),
        active: existingUser.active,
        isNew: false,
        store: existingUser.config ? {
          id: existingUser.config.id,
          storeName: existingUser.config.storeName,
          slug: existingUser.config.publicSlug,
        } : null,
      };
    }

    if (!normalizedEmail) {
      throw new BadRequestException('E-mail é obrigatório para cadastrar uma nova loja');
    }

    const normalizedSlug = dto.slug?.trim().toLowerCase();
    if (normalizedSlug) {
      const existingSlug = await this.prisma.config.findFirst({
        where: { publicSlug: normalizedSlug },
      });
      if (existingSlug) {
        throw new ConflictException('Slug já está em uso por outro lojista');
      }
    }

    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: dto.name || dto.storeName,
          role: Role.OWNER,
          active: true,
          legacyId: legacyId || undefined,
          config: {
            create: {
              storeName: dto.storeName,
              publicSlug: normalizedSlug || undefined,
              primaryColor: '#D4AF37',
              secondaryColor: '#343434',
            },
          },
        },
        include: { config: true },
      });

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: 'admin',
        active: newUser.active,
        isNew: true,
        store: {
          id: newUser.config!.id,
          storeName: newUser.config!.storeName,
          slug: newUser.config!.publicSlug,
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('E-mail ou slug já cadastrado');
      }
      throw error;
    }
  }
}

