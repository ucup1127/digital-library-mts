@echo off
REM scripts/cron-daily.bat
REM Cron harian untuk cek jatuh tempo peminjaman
REM Jalankan manual atau via Windows Task Scheduler

echo [%date% %time%] Running daily cron...

REM Ganti URL dan TOKEN sesuai environment
set APP_URL=http://localhost:3000
set CRON_SECRET=fbbb4faf06a8daba0669fdfdad732e99f4d66ff420dff2742c5a62fa5afdba4a

curl.exe -s -X GET "%APP_URL%/api/cron/check-due-date" ^
  -H "Authorization: Bearer %CRON_SECRET%"

echo.
echo [%date% %time%] Cron done.