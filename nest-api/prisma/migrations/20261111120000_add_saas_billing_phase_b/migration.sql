-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SetupBatchTier" AS ENUM ('UP_TO_200', 'UP_TO_300', 'UP_TO_500');

-- CreateEnum
CREATE TYPE "SetupRequestStatus" AS ENUM ('PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "BillingActionType" AS ENUM ('TRIAL_STARTED', 'CHECKOUT_INTENT_CREATED', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_EXTENDED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_CANCELED', 'SETUP_REQUEST_CREATED', 'SETUP_REQUEST_STATUS_CHANGED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_REACTIVATED');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "plan_code" TEXT NOT NULL DEFAULT 'PRO_MONTHLY',
    "monthly_price_cents" INTEGER NOT NULL DEFAULT 9700,
    "trial_starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trial_ends_at" TIMESTAMP(3) NOT NULL,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "is_exempt" BOOLEAN NOT NULL DEFAULT false,
    "last_payment_note" TEXT,
    "updated_by_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_setup_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "batch_tier" "SetupBatchTier" NOT NULL,
    "max_products" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "include_monthly_plan" BOOLEAN NOT NULL DEFAULT false,
    "monthly_plan_price_cents" INTEGER NOT NULL DEFAULT 0,
    "total_price_cents" INTEGER NOT NULL,
    "status" "SetupRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reference_code" TEXT NOT NULL,
    "contact_phone" TEXT,
    "source_description" TEXT,
    "whatsapp_message" TEXT,
    "admin_notes" TEXT,
    "imported_count" INTEGER,
    "paid_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "updated_by_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_setup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" "BillingActionType" NOT NULL,
    "actor_user_id" UUID,
    "amount_cents" INTEGER,
    "days_granted" INTEGER,
    "reference_code" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_trial_ends_at_idx" ON "subscriptions"("trial_ends_at");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE UNIQUE INDEX "product_setup_requests_reference_code_key" ON "product_setup_requests"("reference_code");

-- CreateIndex
CREATE INDEX "product_setup_requests_user_id_created_at_idx" ON "product_setup_requests"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "product_setup_requests_status_idx" ON "product_setup_requests"("status");

-- CreateIndex
CREATE INDEX "billing_events_user_id_created_at_idx" ON "billing_events"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "billing_events_action_idx" ON "billing_events"("action");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_setup_requests" ADD CONSTRAINT "product_setup_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Idempotent backfill for existing accounts before Phase B launch:
-- 1) Pilot store ('hive') is marked ACTIVE + exempt;
-- 2) Any other pre-existing users receive a fresh 14-day transition trial.
INSERT INTO "subscriptions" (
    "id",
    "user_id",
    "status",
    "plan_code",
    "monthly_price_cents",
    "trial_starts_at",
    "trial_ends_at",
    "activated_at",
    "is_exempt",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    u."id",
    CASE
        WHEN c."public_slug" = 'hive' THEN 'ACTIVE'::"SubscriptionStatus"
        ELSE 'TRIAL'::"SubscriptionStatus"
    END,
    'PRO_MONTHLY',
    9700,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    CASE
        WHEN c."public_slug" = 'hive' THEN CURRENT_TIMESTAMP
        ELSE NULL
    END,
    CASE
        WHEN c."public_slug" = 'hive' THEN true
        ELSE false
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
LEFT JOIN "configs" c ON c."user_id" = u."id"
ON CONFLICT ("user_id") DO NOTHING;
