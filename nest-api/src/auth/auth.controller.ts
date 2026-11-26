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
  HttpException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard, getAdminEmails } from './auth.guard';
import { OnboardDto } from './dto/onboard.dto';
import { RegisterDto } from './dto/register.dto';
import { BillingActionType, Prisma, Role, SubscriptionStatus } from '@prisma/client';
import { SubscriptionService, evaluateSubscriptionAccess } from '../billing/subscription.service';

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  'yopmail.com',
  '10minutemail.com',
  'trashmail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'dispostable.com',
  'getnada.com',
  'temp-mail.org',
  'mohmal.com',
]);

@Controller('api/v2/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  private validateAllowedEmail(email: string): void {
    const trimmed = email.trim().toLowerCase();
    const parts = trimmed.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1] || trimmed.includes('..')) {
      throw new BadRequestException('E-mail inválido. Informe um endereço de e-mail válido.');
    }
    const domain = parts[1];
    const domainLabels = domain.split('.');
    const tld = domainLabels[domainLabels.length - 1] || '';
    if (domainLabels.length < 2 || tld.length < 2) {
      throw new BadRequestException('E-mail inválido. Informe um endereço de e-mail válido.');
    }
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      throw new BadRequestException('Use um e-mail válido e permanente (e-mails temporários não são aceitos).');
    }
  }

  private resolveIsSuperAdmin(email: string | null | undefined, flag?: boolean): boolean {
    if (flag === true) return true;
    const normalized = email?.trim().toLowerCase();
    return Boolean(normalized && getAdminEmails().includes(normalized));
  }

  private mapRole(role: Role): 'admin' | 'editor' | 'viewer' {
    return role === Role.OWNER ? 'admin' : role === Role.SELLER ? 'editor' : 'viewer';
  }

  @UseGuards(AuthGuard)
  @Post('register')
  async register(@Request() req: any, @Body() body: RegisterDto) {
    const legacyId = req.user?.legacyId;
    if (!legacyId) {
      throw new UnauthorizedException('Usuário inválido no contexto de autenticação');
    }

    const normalizedEmail = (req.user?.email || body.email)?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('E-mail é obrigatório para cadastrar uma nova loja');
    }
    this.validateAllowedEmail(normalizedEmail);

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { legacyId },
          { email: { equals: normalizedEmail, mode: 'insensitive' as const } },
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

    const now = new Date();
    const { trialStartsAt, trialEndsAt } = this.subscriptionService.buildTrialDates(now);
    const { planCode, monthlyPriceCents, trialDays } =
      this.subscriptionService.getOnboardingDefaults?.() ?? {
        planCode: 'PRO_MONTHLY',
        monthlyPriceCents: 9700,
        trialDays: 14,
      };
    const isSuperAdmin = this.resolveIsSuperAdmin(normalizedEmail, req.user?.isSuperAdmin);

    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: normalizedEmail,
        phone: body.phone,
        role: Role.OWNER,
        active: true,
        trialEndsAt,
        legacyId,
        config: {
          create: {
            storeName: body.storeName || 'Minha Loja Hive',
            primaryColor: '#F2A900',
            secondaryColor: '#2B2B2E',
            whatsappNumber: body.phone || null,
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
                  note: `Trial automático de ${trialDays} dias iniciado no cadastro.`,
                },
              },
            }
          : {}),
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
    try {
      if (!req.user || (!req.user.id && !req.user.legacyId && !req.user.email)) {
        throw new UnauthorizedException('Usuário inválido no contexto');
      }

      let dbUser: any = null;
      try {
        if (req.user.id) {
          dbUser = await this.prisma.user.findUnique({
            where: { id: req.user.id },
            include: { config: true, subscription: true },
          });
        } else if (req.user.legacyId) {
          dbUser = await this.prisma.user.findUnique({
            where: { legacyId: req.user.legacyId },
            include: { config: true, subscription: true },
          });
        }
      } catch (findErr) {
        this.logger.warn('Falha na busca com include de subscription, tentando fallback sem subscription:', findErr);
        try {
          if (req.user.id) {
            dbUser = await this.prisma.user.findUnique({
              where: { id: req.user.id },
              include: { config: true },
            });
          } else if (req.user.legacyId) {
            dbUser = await this.prisma.user.findUnique({
              where: { legacyId: req.user.legacyId },
              include: { config: true },
            });
          }
        } catch (findErrWithoutSub) {
          this.logger.error('Erro ao buscar dbUser sem subscription:', findErrWithoutSub);
        }
      }

      // Se ainda não encontrou por id ou legacyId, tenta localizar pelo e-mail
      if (!dbUser && req.user.email) {
        try {
          dbUser = await this.prisma.user.findFirst({
            where: {
              email: { equals: req.user.email.trim().toLowerCase(), mode: 'insensitive' as const },
            },
            include: { config: true, subscription: true },
          });
        } catch {
          try {
            dbUser = await this.prisma.user.findFirst({
              where: {
                email: { equals: req.user.email.trim().toLowerCase(), mode: 'insensitive' as const },
              },
              include: { config: true },
            });
          } catch (findEmailErr) {
            this.logger.warn('Falha ao buscar dbUser por email:', findEmailErr);
          }
        }
      }

      if (!dbUser) {
        throw new UnauthorizedException('Registro do usuário não encontrado no banco de dados da plataforma.');
      }

      const isSuperAdmin = this.resolveIsSuperAdmin(dbUser.email, req.user?.isSuperAdmin);
      let subscription: any = null;
      try {
        subscription =
          dbUser.subscription && (!isSuperAdmin || dbUser.subscription.isExempt)
            ? evaluateSubscriptionAccess(dbUser.subscription)
            : await this.subscriptionService.getAccessStatus(dbUser.id, isSuperAdmin);
      } catch (subErr) {
        this.logger.warn('Falha ao carregar status de assinatura em getMe, aplicando fallback seguro:', subErr);
        subscription = {
          status: isSuperAdmin ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL,
          effectiveStatus: isSuperAdmin ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL,
          isBlocked: false,
          isExempt: isSuperAdmin,
          planCode: 'PRO_MONTHLY',
          monthlyPriceCents: 9700,
          trialStartsAt: new Date(),
          trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
          currentPeriodStart: null,
          currentPeriodEnd: null,
          daysRemaining: 14,
        };
      }

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
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.error('Erro inesperado em getMe:', err instanceof Error ? err.stack : err);
      throw new UnauthorizedException('Não foi possível carregar os dados da sessão do usuário.');
    }
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
    this.validateAllowedEmail(normalizedEmail);

    const normalizedPhone = (req.user?.phoneNumber || dto.phone)?.trim() || null;

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
          ...(normalizedPhone ? { phone: normalizedPhone } : {}),
          role: Role.OWNER,
          active: true,
          legacyId: legacyId || undefined,
          config: {
            create: {
              storeName: dto.storeName,
              publicSlug: normalizedSlug || undefined,
              ...(normalizedPhone ? { whatsappNumber: normalizedPhone } : {}),
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
