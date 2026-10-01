CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- ============================================
-- pg_trgm GIN index untuk fuzzy search
-- Extension pg_trgm sudah terinstall (PostgreSQL 17.9)
-- ============================================

-- Book: title, author
CREATE INDEX IF NOT EXISTS "Book_title_trgm_idx" ON "Book" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Book_author_trgm_idx" ON "Book" USING GIN (author gin_trgm_ops);

-- BukuFisik: judul, penulis, isbn, barcode
CREATE INDEX IF NOT EXISTS "BukuFisik_judul_trgm_idx" ON "BukuFisik" USING GIN (judul gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "BukuFisik_penulis_trgm_idx" ON "BukuFisik" USING GIN (penulis gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "BukuFisik_isbn_trgm_idx" ON "BukuFisik" USING GIN (isbn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "BukuFisik_barcode_trgm_idx" ON "BukuFisik" USING GIN (barcode gin_trgm_ops);

-- User: name, email, memberId
CREATE INDEX IF NOT EXISTS "User_name_trgm_idx" ON "User" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_email_trgm_idx" ON "User" USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_memberId_trgm_idx" ON "User" USING GIN ("memberId" gin_trgm_ops);

-- AdminLog: adminName, adminEmail, targetName
CREATE INDEX IF NOT EXISTS "AdminLog_adminName_trgm_idx" ON "AdminLog" USING GIN ("adminName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "AdminLog_adminEmail_trgm_idx" ON "AdminLog" USING GIN ("adminEmail" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "AdminLog_targetName_trgm_idx" ON "AdminLog" USING GIN ("targetName" gin_trgm_ops);

-- VisitorLog: userEmail, bookTitle
CREATE INDEX IF NOT EXISTS "VisitorLog_userEmail_trgm_idx" ON "VisitorLog" USING GIN ("userEmail" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "VisitorLog_bookTitle_trgm_idx" ON "VisitorLog" USING GIN ("bookTitle" gin_trgm_ops);