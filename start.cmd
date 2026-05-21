@echo off
REM Same as dev.cmd
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-local.ps1" %*
if errorlevel 1 pause
