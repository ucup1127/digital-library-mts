-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "uploadedBy" TEXT;

-- CreateIndex
CREATE INDEX "Book_isShared_idx" ON "Book"("isShared");

-- CreateIndex
CREATE INDEX "Book_isShared_createdAt_idx" ON "Book"("isShared", "createdAt");
