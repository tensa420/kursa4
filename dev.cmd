@echo off
REM Запуск без политики PowerShell (обходит PSSecurityException)
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-local.ps1" %*
if errorlevel 1 (
    echo.
    echo Error. Press any key...
    pause >nul
)
