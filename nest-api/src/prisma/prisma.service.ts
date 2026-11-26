import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'> implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    this.$on('error', (event) => {
      this.logger.error(event.message, event.target);
    });
    this.$on('warn', (event) => {
      this.logger.warn(event.message, event.target);
    });
    this.$on('info', (event) => {
      this.logger.log(event.message, event.target);
    });
    this.$on('query', (event) => {
      // Oculta o output pesado das queries do Prisma se nao for ambiente local (opcional)
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`Query: ${event.query} -- Params: ${event.params} -- Duration: ${event.duration}ms`);
      }
    });

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
