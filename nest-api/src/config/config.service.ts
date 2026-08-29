import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(userId: string) {
    const config = await this.prisma.config.findUnique({
      where: { userId },
    });
    
    return config || {};
  }

  async saveConfig(userId: string, data: UpdateConfigDto) {
    return this.prisma.config.upsert({
      where: { userId },
      update: data as any,
      create: {
        ...data,
        userId,
        storeName: data.storeName || 'Minha Loja', // Default if missing on create
      } as any,
    });
  }
}
