-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'ORCAMENTO';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT,
ADD COLUMN "trial_ends_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "notes" TEXT,
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "customer_id" UUID,
ADD COLUMN "nfe_key" TEXT,
ADD COLUMN "nfe_number" INTEGER,
ADD COLUMN "nfe_status" TEXT DEFAULT 'NAO_EMITIDA',
ADD COLUMN "nfe_protocol" TEXT,
ADD COLUMN "nfe_issued_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "due_date" TIMESTAMP(3),
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PAGO';

-- AlterTable
ALTER TABLE "configs" ADD COLUMN "cnpj_emitente" TEXT,
ADD COLUMN "inscricao_estadual" TEXT,
ADD COLUMN "regime_tributario" TEXT DEFAULT 'SIMPLES_NACIONAL',
ADD COLUMN "natureza_operacao" TEXT DEFAULT 'Venda de mercadoria',
ADD COLUMN "nfe_serie" INTEGER DEFAULT 1,
ADD COLUMN "nfe_proximo_numero" INTEGER DEFAULT 1;

-- CreateIndex
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");

-- CreateIndex
CREATE INDEX "customers_document_idx" ON "customers"("document");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
