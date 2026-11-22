@echo off
setlocal enabledelayedexpansion
title thomo.ART StudioCockpit - Distribution Build
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   thomo.ART StudioCockpit - Distribution Build (dist/)
echo ============================================================
echo.

if not exist "version.txt" (
    echo [FEHLER] version.txt nicht gefunden!
    exit /b 1
)

echo [1/5] Erhoehe Version (+0.01) und pruefe Syntax...
if /i "%~1"=="--nobump" goto :skip_bump
if /i "%~2"=="--nobump" goto :skip_bump
python bump_version.py --bump
if errorlevel 1 (
    echo [FEHLER] Versions-Bump fehlgeschlagen!
    exit /b 1
)
goto :after_bump
:skip_bump
python bump_version.py --sync
if errorlevel 1 (
    echo [FEHLER] Versions-Sync fehlgeschlagen!
    exit /b 1
)
:after_bump
set /p APP_VER=<version.txt
set "APP_VER=%APP_VER: =%"

python -m py_compile server.py comfy_client.py bump_version.py backup.py
if errorlevel 1 (
    echo [FEHLER] Syntax-Fehler in Python-Dateien!
    exit /b 1
)

echo.
echo [2/5] Erstelle Snapshot-Backup in backups/...
python backup.py build
if errorlevel 1 (
    echo [WARNUNG] Backup konnte nicht erstellt werden.
)

echo.
echo [3/5] Bereinige alte Build-Artefakte (behalte dist\...\data)...
if exist "build" rmdir /s /q "build"
if exist "dist\tA-Studio-Cockpit\_internal" rmdir /s /q "dist\tA-Studio-Cockpit\_internal"
if exist "dist\tA-Studio-Cockpit\StudioCockpit.exe" del /f /q "dist\tA-Studio-Cockpit\StudioCockpit.exe"
if exist "dist\tA-Studio-Cockpit\StudioCockpit_v*.exe" del /f /q "dist\tA-Studio-Cockpit\StudioCockpit_v*.exe"

echo.
echo [4/5] Baue Windows-Onefile-EXE mit PyInstaller (v%APP_VER%)...
python -m PyInstaller --noconfirm --distpath dist\tA-Studio-Cockpit StudioCockpit.spec
if errorlevel 1 (
    echo [FEHLER] PyInstaller-Build fehlgeschlagen!
    exit /b 1
)

echo.
echo [5/5] Bereite lokalen dist-Ordner und sauberes Release-ZIP vor...
if not exist "dist\tA-Studio-Cockpit\data" mkdir "dist\tA-Studio-Cockpit\data"
if exist "data\config.example.json" copy /y "data\config.example.json" "dist\tA-Studio-Cockpit\data\config.example.json" >nul
if not exist "dist\tA-Studio-Cockpit\data\config.json" (
    if exist "data\config.json" copy /y "data\config.json" "dist\tA-Studio-Cockpit\data\config.json" >nul
)
if exist "README.md" copy /y "README.md" "dist\tA-Studio-Cockpit\README.md" >nul

rem Sauberes ZIP fuer andere Nutzer ohne lokale config.json / webview-Cache
set "ZIP_STAGE=build\zip_stage\tA-Studio-Cockpit"
if exist "build\zip_stage" rmdir /s /q "build\zip_stage"
mkdir "%ZIP_STAGE%\data"
copy /y "dist\tA-Studio-Cockpit\StudioCockpit.exe" "%ZIP_STAGE%\StudioCockpit.exe" >nul
if exist "dist\tA-Studio-Cockpit\README.md" copy /y "dist\tA-Studio-Cockpit\README.md" "%ZIP_STAGE%\README.md" >nul
if exist "data\config.example.json" copy /y "data\config.example.json" "%ZIP_STAGE%\data\config.example.json" >nul

set "VERSIONED_EXE=dist\tA-Studio-Cockpit\StudioCockpit_v%APP_VER%.exe"
copy /y "dist\tA-Studio-Cockpit\StudioCockpit.exe" "%VERSIONED_EXE%" >nul
if not errorlevel 1 (
    echo Versionierte EXE erstellt: %VERSIONED_EXE%
)

set "ZIP_NAME=tA-Studio-Cockpit_v%APP_VER%_win64.zip"
if exist "dist\%ZIP_NAME%" del /f /q "dist\%ZIP_NAME%"
powershell -NoProfile -Command "$ProgressPreference = 'SilentlyContinue'; Compress-Archive -Path '%ZIP_STAGE%' -DestinationPath 'dist\%ZIP_NAME%' -Force"
if errorlevel 1 (
    echo [WARNUNG] ZIP-Erstellung fehlgeschlagen, Ordner dist\tA-Studio-Cockpit ist aber bereit.
) else (
    echo ZIP erstellt: dist\%ZIP_NAME%
)
if exist "build\zip_stage" rmdir /s /q "build\zip_stage"

echo.
echo ============================================================
echo   Distribution Build v%APP_VER% erfolgreich abgeschlossen!
echo   Lokal:  dist\tA-Studio-Cockpit\StudioCockpit.exe
echo   Tester: %VERSIONED_EXE%
echo   Archiv: dist\%ZIP_NAME%
echo ============================================================
if "%~1" neq "--nopause" pause
