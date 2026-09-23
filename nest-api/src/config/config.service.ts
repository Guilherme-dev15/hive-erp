import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(userId: string) {
    const config = await this.prisma.config.findUnique({
      where: { userId },
    });

    if (!config) return {};

    return {
      ...config,
      slug: config.publicSlug,
    };
  }

  async saveConfig(userId: string, data: UpdateConfigDto) {
    const { slug, ...configData } = data;
    const publicSlug = slug === undefined ? undefined : this.normalizeSlug(slug);

    try {
      const config = await this.prisma.config.upsert({
        where: { userId },
        update: {
          ...configData,
          ...(publicSlug !== undefined ? { publicSlug } : {}),
        },
        create: {
          ...configData,
          ...(publicSlug !== undefined ? { publicSlug } : {}),
          userId,
          storeName: data.storeName || 'Minha Loja',
        },
      });

      return {
        ...config,
        slug: config.publicSlug,
      };
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
