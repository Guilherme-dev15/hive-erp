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

    // Auto-sync de schema idempotente para resiliência serverless
    if (process.env.NODE_ENV === 'production') {
      try {
        await this.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "subscriptions" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "user_id" UUID NOT NULL UNIQUE,
            "status" TEXT NOT NULL DEFAULT 'TRIAL',
            "plan_code" TEXT NOT NULL DEFAULT 'PRO_MONTHLY',
            "monthly_price_cents" INTEGER NOT NULL DEFAULT 9700,
            "trial_starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "trial_ends_at" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
            "current_period_start" TIMESTAMP(3),
            "current_period_end" TIMESTAMP(3),
            "activated_at" TIMESTAMP(3),
            "canceled_at" TIMESTAMP(3),
            "is_exempt" BOOLEAN NOT NULL DEFAULT false,
            "last_payment_note" TEXT,
            "updated_by_admin_id" UUID,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
          );
        `);
        await this.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;`);
        await this.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP(3);`);
        await this.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_id" UUID;`);
        await this.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "nfe_key" TEXT;`);
        await this.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "nfe_number" INTEGER;`);
        await this.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "nfe_status" TEXT DEFAULT 'NAO_EMITIDA';`);
        await this.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "nfe_protocol" TEXT;`);
        await this.$executeRawUnsafe(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "nfe_issued_at" TIMESTAMP(3);`);
        await this.$executeRawUnsafe(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMP(3);`);
        await this.$executeRawUnsafe(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PAGO';`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "cnpj_emitente" TEXT;`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "inscricao_estadual" TEXT;`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "regime_tributario" TEXT DEFAULT 'SIMPLES_NACIONAL';`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "natureza_operacao" TEXT DEFAULT 'Venda de mercadoria';`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "nfe_serie" INTEGER DEFAULT 1;`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "nfe_proximo_numero" INTEGER DEFAULT 1;`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "checkout_mode" TEXT NOT NULL DEFAULT 'WHATSAPP';`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "has_gateway_addon" BOOLEAN NOT NULL DEFAULT false;`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "gateway_provider" TEXT;`);
        await this.$executeRawUnsafe(`ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "gateway_public_key" TEXT;`);
      } catch (err) {
        this.logger.warn('Aviso no auto-sync de schema idempotente:', err);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
