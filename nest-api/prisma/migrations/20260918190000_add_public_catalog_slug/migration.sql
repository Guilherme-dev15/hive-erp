-- Add nullable public identifiers without publishing existing stores.
ALTER TABLE "configs" ADD COLUMN "public_slug" TEXT;

CREATE UNIQUE INDEX "configs_public_slug_key" ON "configs"("public_slug");
