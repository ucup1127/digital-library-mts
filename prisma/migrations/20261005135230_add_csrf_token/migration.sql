-- Tambah kolom nullable dulu
ALTER TABLE "Session" ADD COLUMN "csrfToken" TEXT;

-- Isi nilai untuk row existing pakai md5 random
UPDATE "Session" 
SET "csrfToken" = md5(random()::text || clock_timestamp()::text) || md5(random()::text)
WHERE "csrfToken" IS NULL;

-- Baru jadikan NOT NULL + UNIQUE
ALTER TABLE "Session" ALTER COLUMN "csrfToken" SET NOT NULL;
CREATE UNIQUE INDEX "Session_csrfToken_key" ON "Session"("csrfToken");
CREATE INDEX "Session_csrfToken_idx" ON "Session"("csrfToken");