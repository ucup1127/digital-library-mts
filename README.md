# 📚 Muhapati Library

Perpustakaan digital untuk **MTs Muhammadiyah Patikraja**. Aplikasi web untuk mengelola katalog buku digital & fisik, peminjaman, dan administrasi perpustakaan sekolah.

**Stack:** Next.js 16 + React 19 + Prisma 7 + PostgreSQL + Tailwind CSS

---

## ✨ Fitur

### Untuk Pengunjung (Public)
- 📖 Katalog buku digital — cari, filter, sort
- 📄 Baca buku digital (PDF) — perlu login
- 🏫 Profil sekolah — visi, misi, sejarah, galeri
- 📞 Halaman tentang & bantuan

### Untuk Siswa (User)
- 👤 Profil & ganti password
- 📚 Riwayat peminjaman buku fisik
- 🔔 Lihat status peminjaman (dipinjam / terlambat / dikembalikan)

### Untuk Admin Sekolah
- 📊 Dashboard statistik
- 📚 Kelola buku digital (CRUD, import, export)
- 📕 Kelola buku fisik (CRUD, barcode)
- 📂 Kelola kategori
- 👥 Kelola user/siswa
- 🔄 Kelola peminjaman buku fisik
- 🖼️ Kelola galeri
- 📝 Kelola profil sekolah (visi, misi, tentang)
- 📋 Log aktivitas admin

### Untuk Super Admin
- 🏫 Kelola multi-sekolah (multi-tenant)
- ⚙️ Pengaturan sistem (maintenance mode, backup)
- 📊 Log sistem & admin (semua sekolah)
- 👤 Kelola admin sekolah

---

## 🛠️ Tech Stack

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 16.2.4 | Framework (App Router) |
| React | 19 | UI Library |
| Prisma | 7 | ORM |
| PostgreSQL | 15+ | Database |
| Tailwind CSS | 4 | Styling |
| bcrypt | 6 | Password hashing |
| TypeScript | 5+ | Type safety |

---

## 📋 Prasyarat

- **Node.js** 20+ — [Download](https://nodejs.org)
- **PostgreSQL** 15+ — [Download](https://www.postgresql.org/download/)
- **npm** atau **pnpm**

---

## 🚀 Setup Development

### 1. Clone Repo

```bash
git clone https://github.com/ucup1127/digital-library-mts.git
cd digital-library-mts
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel di `.env.local` (lihat tabel di bawah).

### 4. Generate Token Backup

Buat random string untuk `BACKUP_SECRET_TOKEN`:

```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

```bash
# Bash / Linux
openssl rand -hex 32
```

### 5. Setup Database

```bash
# Sync schema ke database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 6. Jalankan Dev Server

```bash
npm run dev
```

Buka **http://localhost:3000**

### 7. Buat Admin Pertama

Setelah dev server jalan, buat admin pertama lewat **Prisma Studio**:

```bash
npx prisma studio
```

Atau lewat script seed (kalau ada).

---

## 🔐 Environment Variables

Buat file `.env.local` di root proyek:

| Variable | Wajib | Deskripsi | Contoh |
|---|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/muhapati` |
| `BACKUP_SECRET_TOKEN` | ✅ | Token untuk endpoint backup/restore | random string 32 karakter |
| `NEXTAUTH_URL` | ✅ | URL aplikasi | `http://localhost:3000` |
| `CRON_SECRET` | ⚠️ | Token untuk endpoint cron | random string |
| `UPLOADTHING_SECRET` | ⚠️ | Uploadthing secret | dari dashboard Uploadthing |
| `UPLOADTHING_APP_ID` | ⚠️ | Uploadthing app ID | dari dashboard Uploadthing |
| `REDIS_URL` | ⚠️ | Redis URL (opsional) | `redis://localhost:6379` |

---

## 🏗️ Arsitektur

### Autentikasi (Session-based)

Aplikasi pakai **session-based auth** dengan cookie `httpOnly` — bukan JWT, bukan localStorage.

**Flow:**
```
1. Login → POST /api/auth/login
   → Verifikasi email & password (bcrypt)
   → Bikin session di DB (model Session)
   → Set cookie `session_token` (httpOnly, SameSite=Lax)
   → Return user data

2. Akses halaman admin → proxy.ts (Edge)
   → Cek cookie `session_token`
   → Redirect ke /login/admin kalau nggak ada

3. Guard di server:
   - getSession() → return session atau null
   - requireAuth() → throw 401 kalau nggak login
   - requireAdmin() → throw 403 kalau bukan admin
   - requireSuperAdmin() → throw 403 kalau bukan super admin

4. Logout → POST /api/auth/logout
   → Hapus session dari DB
   → Clear cookie
```

**Kenapa session, bukan JWT?**
- ✅ Logout langsung berlaku (hapus di DB)
- ✅ Ganti role langsung berlaku
- ✅ Nggak perlu blacklist token
- ✅ Cookie `httpOnly` — nggak bisa dibaca JS

### Multi-Tenant (Multi-Sekolah)

Setiap data (buku, user, peminjaman) punya `schoolId`.

- **ADMIN** — cuma akses sekolahnya sendiri
- **SUPER_ADMIN** — bisa akses semua sekolah
- **USER** — cuma lihat data sekolahnya

Filter `schoolId` **wajib** di semua query.

### Route Groups

```
app/
├── (admin)/admin/       # Halaman admin — butuh login
├── (auth)/login/        # Halaman login
├── (public)/            # Halaman public — nggak butuh login
├── api/                 # API routes
└── maintenance/         # Halaman maintenance
```

Route group **nggak muncul di URL** — cuma untuk organisasi.

### Maintenance Mode

- Toggle di `/admin/settings` (SUPER_ADMIN only)
- Disimpan di DB (`Setting` model)
- Di-set cookie `maintenance_mode` (httpOnly)
- Proxy cek cookie → redirect ke `/maintenance`
- Kecuali: `/maintenance`, `/login/admin`, `/admin/*`, `/api/*`

---

## 📁 Struktur Folder

```
app/
├── (admin)/admin/           # Halaman admin (23 halaman)
│   ├── layout.tsx           # Server Component — cek session
│   ├── AdminLayoutClient.tsx # Client Component — UI
│   ├── page.tsx             # Dashboard
│   ├── buku/                # Kelola buku digital
│   ├── buku-fisik/          # Kelola buku fisik
│   ├── kategori/            # Kelola kategori
│   ├── users/               # Kelola user
│   ├── peminjaman-fisik/    # Kelola peminjaman
│   ├── galeri/              # Kelola galeri
│   ├── sekolah/             # Kelola sekolah (SUPER_ADMIN)
│   ├── settings/            # Pengaturan (SUPER_ADMIN)
│   ├── admin-log/           # Log admin
│   └── system-log/          # Log sistem
│
├── (auth)/login/            # Login admin & user
├── (public)/                # Halaman public
│   ├── page.tsx             # Beranda
│   ├── buku/[id]/           # Detail buku
│   ├── akun/                # Profil user
│   ├── galeri/              # Galeri
│   └── ...
│
├── api/                     # ~50 API routes
│   ├── auth/                # Login, logout, me
│   ├── admin/               # Admin API
│   ├── buku/                # CRUD buku
│   ├── buku-fisik/          # CRUD buku fisik
│   ├── peminjaman-fisik/    # Peminjaman
│   └── ...
│
└── maintenance/             # Halaman maintenance

lib/
├── auth.ts                  # Session helper
├── db.ts                    # Prisma client
├── admin-log.ts             # Log admin
├── system-log.ts            # Log sistem
├── backup-auth.ts           # Cek token backup
└── backup-data.ts           # Ambil data backup

prisma/
├── schema.prisma            # Schema database
└── seed-dummy.ts            # Seed data dummy

components/
├── admin/                   # Component admin
├── public/                  # Component public
├── ui/                      # Component UI umum
└── pdf/                     # Component PDF
```

---

## 🚢 Deploy Production

### 1. Siapkan Server

- VPS dengan Node.js 20+ & PostgreSQL 15+
- Atau server sekolah/UMP

### 2. Setup Database

```bash
# Buat database
createdb muhapati_library

# Atau lewat psql
psql -U postgres -c "CREATE DATABASE muhapati_library;"
```

### 3. Clone & Setup

```bash
git clone https://github.com/ucup1127/digital-library-mts.git
cd digital-library-mts
npm install
```

### 4. Set Environment Variables

Buat `.env` (bukan `.env.local` — untuk production):

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/muhapati_library"
BACKUP_SECRET_TOKEN="random-string-32-char"
NEXTAUTH_URL="https://perpus.sekolah.sch.id"
CRON_SECRET="random-string"
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."
```

### 5. Migrate Database

```bash
npx prisma db push
npx prisma generate
```

### 6. Build & Start

```bash
npm run build
npm start
```

Default jalan di port **3000**.

### 7. Setup Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name perpus.sekolah.sch.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name perpus.sekolah.sch.id;

    ssl_certificate /etc/letsencrypt/live/perpus.sekolah.sch.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/perpus.sekolah.sch.id/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8. Setup SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d perpus.sekolah.sch.id
```

### 9. Setup Backup Otomatis (Cron)

```bash
# Edit crontab
crontab -e

# Tambah baris ini — backup setiap hari jam 01:00
0 1 * * * curl -s "https://perpus.sekolah.sch.id/api/admin/auto-backup?token=YOUR_BACKUP_TOKEN" > /dev/null
```

### 10. Setup PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start npm --name "muhapati" -- start
pm2 save
pm2 startup
```

---

## 🧪 Testing

```bash
# Type check
npx tsc --noEmit

# Build test
npm run build

# Dev server
npm run dev
```

---

## 📝 Lisensi

Proyek **Kerja Praktik** — MTs Muhammadiyah Patikraja.

---

## 👤 Kontak

- **Developer:** Luthfi Yusuf Ti
- **Institusi:** MTs Muhammadiyah Patikraja
- **Repo:** [github.com/ucup1127/digital-library-mts](https://github.com/ucup1127/digital-library-mts)

