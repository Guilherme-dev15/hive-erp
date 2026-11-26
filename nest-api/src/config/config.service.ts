import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { encryptSecret } from '../common/crypto.util';

const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitizeConfig(config: any) {
    const { gatewayAccessToken, gatewayWebhookSecret, ...safeConfig } = config;
    return {
      ...safeConfig,
      slug: config.publicSlug,
      hasGatewayAccessToken: Boolean(gatewayAccessToken),
      hasGatewayWebhookSecret: Boolean(gatewayWebhookSecret),
    };
  }

  async getConfig(userId: string) {
    const config = await this.prisma.config.findUnique({
      where: { userId },
    });

    if (!config) return {};

    return this.sanitizeConfig(config);
  }

  async saveConfig(userId: string, data: UpdateConfigDto) {
    const {
      slug,
      hasGatewayAddon: _ignoredHasGatewayAddon,
      gatewayAccessToken,
      gatewayWebhookSecret,
      clearGatewayAccessToken,
      clearGatewayWebhookSecret,
      ...configData
    } = data;

    const publicSlug = slug === undefined ? undefined : this.normalizeSlug(slug);

    const needsGatewayAddon =
      configData.checkoutMode === 'GATEWAY' ||
      Boolean(gatewayAccessToken?.trim()) ||
      Boolean(gatewayWebhookSecret?.trim());

    if (needsGatewayAddon) {
      const existing = await this.prisma.config.findUnique({ where: { userId } });
      const isAddonActive = Boolean(existing?.hasGatewayAddon);
      if (!isAddonActive) {
        throw new BadRequestException(
          'O Módulo de Gateway Integrado precisa ser contratado para ativar este modo de checkout.',
        );
      }
    }

    const secretUpdates: Record<string, string | null> = {};
    if (clearGatewayAccessToken) {
      secretUpdates.gatewayAccessToken = null;
    } else if (gatewayAccessToken !== undefined && gatewayAccessToken.trim().length > 0) {
      secretUpdates.gatewayAccessToken = encryptSecret(gatewayAccessToken.trim());
    }

    if (clearGatewayWebhookSecret) {
      secretUpdates.gatewayWebhookSecret = null;
    } else if (gatewayWebhookSecret !== undefined && gatewayWebhookSecret.trim().length > 0) {
      secretUpdates.gatewayWebhookSecret = encryptSecret(gatewayWebhookSecret.trim());
    }

    try {
      const config = await this.prisma.config.upsert({
        where: { userId },
        update: {
          ...configData,
          ...secretUpdates,
          ...(publicSlug !== undefined ? { publicSlug } : {}),
        },
        create: {
          ...configData,
          ...secretUpdates,
          ...(publicSlug !== undefined ? { publicSlug } : {}),
          userId,
          storeName: data.storeName || 'Minha Loja',
        },
      });

      return this.sanitizeConfig(config);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Slug já está em uso');
      }
      throw error;
    }
  }

  private normalizeSlug(slug: string): string {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!PUBLIC_SLUG_PATTERN.test(normalizedSlug) || normalizedSlug.length < 3 || normalizedSlug.length > 63) {
      throw new ConflictException('Slug inválido');
    }
    return normalizedSlug;
  }
}
