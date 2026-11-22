@echo off
rem thomo.ART StudioCockpit - Startskript (Native Desktop App)
cd /d "%~dp0"

rem Beende vorherige Instanzen von server.py auf Port 8095
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8095 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

where pythonw >nul 2>nul
if not errorlevel 1 (
    start "" pythonw server.py %*
    exit
)

where pyw >nul 2>nul
if not errorlevel 1 (
    start "" pyw server.py %*
    exit
)

python server.py %*
