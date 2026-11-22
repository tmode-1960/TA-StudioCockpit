@echo off
title thomo.ART StudioCockpit - Auto-Build Watcher
chcp 65001 >nul
cd /d "%~dp0"

python watch_build.py %*
pause
