-- AlterTable
ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "checkout_mode" TEXT NOT NULL DEFAULT 'WHATSAPP';
ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "has_gateway_addon" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "gateway_provider" TEXT;
ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "gateway_public_key" TEXT;
