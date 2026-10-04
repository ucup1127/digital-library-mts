/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nisn]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AdminLog_adminEmail_trgm_idx";

-- DropIndex
DROP INDEX "AdminLog_adminName_trgm_idx";

-- DropIndex
DROP INDEX "AdminLog_targetName_trgm_idx";

-- DropIndex
DROP INDEX "Book_author_trgm_idx";

-- DropIndex
DROP INDEX "Book_title_trgm_idx";

-- DropIndex
DROP INDEX "BukuFisik_barcode_trgm_idx";

-- DropIndex
DROP INDEX "BukuFisik_isbn_trgm_idx";

-- DropIndex
DROP INDEX "BukuFisik_judul_trgm_idx";

-- DropIndex
DROP INDEX "BukuFisik_penulis_trgm_idx";

-- DropIndex
DROP INDEX "User_email_trgm_idx";

-- DropIndex
DROP INDEX "User_memberId_trgm_idx";

-- DropIndex
DROP INDEX "User_name_trgm_idx";

-- DropIndex
DROP INDEX "VisitorLog_bookTitle_trgm_idx";

-- DropIndex
DROP INDEX "VisitorLog_userEmail_trgm_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nisn" TEXT,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_nisn_key" ON "User"("nisn");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_nisn_idx" ON "User"("nisn");
