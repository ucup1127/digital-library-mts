-- CreateIndex
CREATE INDEX "AdminLog_targetType_idx" ON "AdminLog"("targetType");

-- CreateIndex
CREATE INDEX "AdminLog_schoolId_targetType_idx" ON "AdminLog"("schoolId", "targetType");

-- CreateIndex
CREATE INDEX "AdminLog_targetType_createdAt_idx" ON "AdminLog"("targetType", "createdAt");

-- CreateIndex
CREATE INDEX "Book_schoolId_title_idx" ON "Book"("schoolId", "title");

-- CreateIndex
CREATE INDEX "Book_schoolId_author_idx" ON "Book"("schoolId", "author");

-- CreateIndex
CREATE INDEX "Book_schoolId_year_idx" ON "Book"("schoolId", "year");

-- CreateIndex
CREATE INDEX "BukuFisik_schoolId_penulis_idx" ON "BukuFisik"("schoolId", "penulis");

-- CreateIndex
CREATE INDEX "BukuFisik_schoolId_isbn_idx" ON "BukuFisik"("schoolId", "isbn");

-- CreateIndex
CREATE INDEX "BukuFisik_schoolId_lokasiRak_idx" ON "BukuFisik"("schoolId", "lokasiRak");

-- CreateIndex
CREATE INDEX "PeminjamanFisik_tglPinjam_idx" ON "PeminjamanFisik"("tglPinjam");

-- CreateIndex
CREATE INDEX "PeminjamanFisik_userId_tglPinjam_idx" ON "PeminjamanFisik"("userId", "tglPinjam");

-- CreateIndex
CREATE INDEX "PeminjamanFisik_bukuFisikId_tglPinjam_idx" ON "PeminjamanFisik"("bukuFisikId", "tglPinjam");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Setting_schoolId_key_idx" ON "Setting"("schoolId", "key");

-- CreateIndex
CREATE INDEX "VisitorLog_bookId_idx" ON "VisitorLog"("bookId");

-- CreateIndex
CREATE INDEX "VisitorLog_bookId_createdAt_idx" ON "VisitorLog"("bookId", "createdAt");
