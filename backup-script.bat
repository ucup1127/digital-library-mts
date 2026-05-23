@echo off
echo ========================================
echo   Auto Backup Database MUHPATHLIB
echo ========================================
echo.

curl -X GET "http://localhost:3000/api/admin/auto-backup?token=rahasia_backup_12345"

echo.
echo ========================================
echo   Backup selesai!
echo ========================================
pause