@echo off
echo ============================================
echo CRM Database Export Script
echo ============================================
echo.
echo This will export your crm_database to SQL file
echo.

set OUTPUT_FILE=crm_database_export_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set OUTPUT_FILE=%OUTPUT_FILE: =0%

echo Exporting database to: %OUTPUT_FILE%
echo.

cd c:\xampp\mysql\bin
mysql.exe -u root crm_database > "%~dp0%OUTPUT_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo SUCCESS! Database exported successfully
    echo ============================================
    echo.
    echo File saved at:
    echo %~dp0%OUTPUT_FILE%
    echo.
    echo You can now upload this file to Hostinger phpMyAdmin
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR! Export failed
    echo ============================================
    echo.
    echo Please check:
    echo 1. XAMPP MySQL is running
    echo 2. Database name is correct (crm_database)
    echo 3. You have proper permissions
    echo.
)

pause
