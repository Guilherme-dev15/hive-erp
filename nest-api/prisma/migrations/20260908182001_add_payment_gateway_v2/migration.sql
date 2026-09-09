-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'BOLETO', 'MANUAL');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAGO';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "gateway_order_id" TEXT,
ADD COLUMN     "gateway_payment_url" TEXT,
ADD COLUMN     "gateway_status" TEXT,
ADD COLUMN     "payment_method" "PaymentMethod";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "gateway_transaction_id" TEXT;

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "gateway_order_id" TEXT,
    "gateway_transaction_id" TEXT,
    "amount" DECIMAL(10,2),
    "payload" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_webhook_events_gateway_order_id_idx" ON "payment_webhook_events"("gateway_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_event_id_key" ON "payment_webhook_events"("provider", "event_id");
