@echo off
rem thomo.ART StudioCockpit - Startskript mit Konsolen-Ausgabe (fuer Debugging)
cd /d "%~dp0"
title thomo.ART StudioCockpit (Debug Console)

rem Beende vorherige Instanzen von server.py auf Port 8095
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8095 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

python server.py --browser
pause
