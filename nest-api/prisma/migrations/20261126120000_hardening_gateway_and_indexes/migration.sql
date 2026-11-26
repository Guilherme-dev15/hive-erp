-- Add encrypted merchant gateway credentials to configs
ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "gateway_access_token" TEXT;
ALTER TABLE "configs" ADD COLUMN IF NOT EXISTS "gateway_webhook_secret" TEXT;

-- Add multi-tenant and foreign key indexes for scale and fast lookup
CREATE INDEX IF NOT EXISTS "categories_user_id_idx" ON "categories"("user_id");
CREATE INDEX IF NOT EXISTS "suppliers_user_id_idx" ON "suppliers"("user_id");
CREATE INDEX IF NOT EXISTS "products_user_id_idx" ON "products"("user_id");
CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx" ON "product_variants"("product_id");
CREATE INDEX IF NOT EXISTS "coupons_user_id_idx" ON "coupons"("user_id");
CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders"("user_id");
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions"("user_id");
CREATE INDEX IF NOT EXISTS "inventory_logs_user_id_idx" ON "inventory_logs"("user_id");
