import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard, getAdminEmails } from './auth.guard';
import { OnboardDto } from './dto/onboard.dto';
import { BillingActionType, Prisma, Role, SubscriptionStatus } from '@prisma/client';
import { SubscriptionService, evaluateSubscriptionAccess } from '../billing/subscription.service';

@Controller('api/v2/auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  private resolveIsSuperAdmin(email: string | null | undefined, flag?: boolean): boolean {
    if (flag === true) return true;
    const normalized = email?.trim().toLowerCase();
    return Boolean(normalized && getAdminEmails().includes(normalized));
  }

  private mapRole(role: Role): 'admin' | 'editor' | 'viewer' {
    return role === Role.OWNER ? 'admin' : role === Role.SELLER ? 'editor' : 'viewer';
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    if (!req.user || (!req.user.id && !req.user.legacyId)) {
      throw new UnauthorizedException('Usuário inválido no contexto');
    }

    const dbUser = req.user.id
      ? await this.prisma.user.findUnique({
          where: { id: req.user.id },
          include: { config: true, subscription: true },
        })
      : await this.prisma.user.findUnique({
          where: { legacyId: req.user.legacyId },
          include: { config: true, subscription: true },
        });

    if (!dbUser) {
      throw new UnauthorizedException('Registro do usuário não encontrado no banco de dados da plataforma.');
    }

    const isSuperAdmin = this.resolveIsSuperAdmin(dbUser.email, req.user?.isSuperAdmin);
    const subscription =
      dbUser.subscription && (!isSuperAdmin || dbUser.subscription.isExempt)
        ? evaluateSubscriptionAccess(dbUser.subscription)
        : await this.subscriptionService.getAccessStatus(dbUser.id, isSuperAdmin);

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: this.mapRole(dbUser.role),
      active: dbUser.active,
      isSuperAdmin,
      store: dbUser.config
        ? {
            id: dbUser.config.id,
            storeName: dbUser.config.storeName,
            slug: dbUser.config.publicSlug,
            primaryColor: dbUser.config.primaryColor,
            secondaryColor: dbUser.config.secondaryColor,
          }
        : null,
      subscription,
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

    // Prioriza o e-mail verificado no token JWT para evitar spoof de e-mail
    const normalizedEmail = (req.user?.email || dto.email)?.trim().toLowerCase();

    let existingUser = null;
    if (userId) {
      existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { config: true, subscription: true },
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
        include: { config: true, subscription: true },
      });
    }

    if (existingUser) {
      const isSuperAdmin = this.resolveIsSuperAdmin(existingUser.email, req.user?.isSuperAdmin);
      const subscription =
        existingUser.subscription && (!isSuperAdmin || existingUser.subscription.isExempt)
          ? evaluateSubscriptionAccess(existingUser.subscription)
          : await this.subscriptionService.getAccessStatus(existingUser.id, isSuperAdmin);

      return {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: this.mapRole(existingUser.role),
        active: existingUser.active,
        isNew: false,
        isSuperAdmin,
        store: existingUser.config
          ? {
              id: existingUser.config.id,
              storeName: existingUser.config.storeName,
              slug: existingUser.config.publicSlug,
              primaryColor: existingUser.config.primaryColor,
              secondaryColor: existingUser.config.secondaryColor,
            }
          : null,
        subscription,
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

    const isSuperAdmin = this.resolveIsSuperAdmin(normalizedEmail, req.user?.isSuperAdmin);
    const now = new Date();
    const { trialStartsAt, trialEndsAt } = this.subscriptionService.buildTrialDates(now);
    const { planCode, monthlyPriceCents, trialDays } =
      this.subscriptionService.getOnboardingDefaults?.() ?? {
        planCode: 'PRO_MONTHLY',
        monthlyPriceCents: 9700,
        trialDays: 14,
      };

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
          subscription: {
            create: {
              status: isSuperAdmin ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL,
              planCode,
              monthlyPriceCents,
              trialStartsAt,
              trialEndsAt,
              activatedAt: isSuperAdmin ? now : null,
              isExempt: isSuperAdmin,
            },
          },
          ...(!isSuperAdmin
            ? {
                billingEvents: {
                  create: {
                    action: BillingActionType.TRIAL_STARTED,
                    daysGranted: trialDays,
                    note: `Trial automático de ${trialDays} dias iniciado no onboarding.`,
                  },
                },
              }
            : {}),
        },
        include: { config: true, subscription: true },
      });

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: 'admin',
        active: newUser.active,
        isNew: true,
        isSuperAdmin,
        store: {
          id: newUser.config!.id,
          storeName: newUser.config!.storeName,
          slug: newUser.config!.publicSlug,
          primaryColor: newUser.config!.primaryColor,
          secondaryColor: newUser.config!.secondaryColor,
        },
        subscription: newUser.subscription
          ? evaluateSubscriptionAccess(newUser.subscription, now)
          : await this.subscriptionService.getAccessStatus(newUser.id, isSuperAdmin, now),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('E-mail ou slug já cadastrado');
      }
      throw error;
    }
  }
}
