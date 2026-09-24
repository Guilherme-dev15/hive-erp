import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const CREATE_BATCH_TABLE = `
  CREATE TABLE IF NOT EXISTS "preview_migration_batches" (
    "nonce" TEXT PRIMARY KEY,
    "operation_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "body_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "preview_migration_batches_operation_batch_key" UNIQUE ("operation_id", "batch_id")
  )
`;

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

@Injectable()
export class PreviewMigrationGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; body?: unknown; rawBody?: Buffer; header(name: string): string | undefined }>();
    const now = Date.now();
    const header = (name: string): string | undefined => request.header?.(name) ?? request.headers[name];
    const timestamp = Number(header('x-preview-migration-timestamp'));
    const nonce = header('x-preview-migration-nonce');
    const signature = header('x-preview-migration-signature');
    const secret = process.env.PREVIEW_MIGRATION_SECRET;
    const expiresAt = Number(process.env.PREVIEW_MIGRATION_EXPIRES_AT);

    if (
      process.env.VERCEL_ENV !== 'preview' ||
      process.env.PREVIEW_MIGRATION_ENABLED !== 'true' ||
      !secret ||
      !Number.isFinite(expiresAt) ||
      now >= expiresAt ||
      !Number.isFinite(timestamp) ||
      Math.abs(now - timestamp) > MAX_CLOCK_SKEW_MS ||
      !nonce ||
      !signature
    ) {
      throw new UnauthorizedException('Operação temporária indisponível');
    }

    const body = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
    const bodyHash = createHash('sha256').update(body).digest('hex');
    const digest = createHmac('sha256', secret)
      .update(`${timestamp}.${nonce}.${bodyHash}`)
      .digest('hex');
    const expected = Buffer.from(digest, 'utf8');
    const received = Buffer.from(signature, 'utf8');

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new UnauthorizedException('Assinatura inválida');
    }

    const batch = this.extractBatchIdentity(request.body);
    await this.prisma.$executeRawUnsafe(CREATE_BATCH_TABLE);

    const byNonce = await this.prisma.$queryRaw<Array<{ operation_id: string; batch_id: string; body_hash: string }>>`
      SELECT "operation_id", "batch_id", "body_hash"
      FROM "preview_migration_batches"
      WHERE "nonce" = ${nonce}
    `;
    if (byNonce.length > 0) {
      if (byNonce[0].operation_id !== batch.operationId || byNonce[0].batch_id !== batch.batchId || byNonce[0].body_hash !== bodyHash) {
        throw new ConflictException('Nonce já utilizado');
      }
      return true;
    }

    const byBatch = await this.prisma.$queryRaw<Array<{ nonce: string; body_hash: string }>>`
      SELECT "nonce", "body_hash"
      FROM "preview_migration_batches"
      WHERE "operation_id" = ${batch.operationId} AND "batch_id" = ${batch.batchId}
    `;
    if (byBatch.length > 0) {
      if (byBatch[0].body_hash !== bodyHash) throw new ConflictException('Lote já utilizado com payload diferente');
      return true;
    }

    try {
      await this.prisma.$executeRaw`
        INSERT INTO "preview_migration_batches" ("nonce", "operation_id", "batch_id", "body_hash")
        VALUES (${nonce}, ${batch.operationId}, ${batch.batchId}, ${bodyHash})
      `;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Lote já utilizado');
      }
      throw error;
    }

    return true;
  }

  private extractBatchIdentity(body: unknown): { operationId: string; batchId: string } {
    if (!body || typeof body !== 'object') throw new UnauthorizedException('Body inválido');
    const value = body as Record<string, unknown>;
    if (typeof value.operationId !== 'string' || typeof value.batchId !== 'string') {
      throw new UnauthorizedException('Lote inválido');
    }
    return { operationId: value.operationId, batchId: value.batchId };
  }
}
