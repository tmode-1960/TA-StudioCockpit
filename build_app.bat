@echo off
setlocal enabledelayedexpansion
title thomo.ART StudioCockpit - Build & Version Bump
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   thomo.ART StudioCockpit - Build & Release Bumper
echo ============================================================
echo.

echo [1/2] Versionsnummer um 0.01 erhoehen...
python bump_version.py --bump
if errorlevel 1 (
    echo [FEHLER] Versions-Bump fehlgeschlagen!
    pause
    exit /b 1
)

echo.
echo [2/2] Pruefe Python-Dateien...
python -m py_compile server.py bump_version.py
if errorlevel 1 (
    echo [FEHLER] Syntax-Fehler in Python-Dateien!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Build und Version-Bump erfolgreich abgeschlossen!
echo ============================================================
pause
