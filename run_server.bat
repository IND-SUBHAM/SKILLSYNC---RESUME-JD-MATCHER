@echo off
title SkillSync Resume & JD Matcher Server
echo ===================================================
echo           Starting SkillSync Server
echo ===================================================

:: Detect Python executable
set "PY_BIN="

if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" (
    set "PY_BIN=%LOCALAPPDATA%\Programs\Python\Python314\python.exe"
) else if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set "PY_BIN=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set "PY_BIN=python"
    ) else (
        where py >nul 2>nul
        if %errorlevel% equ 0 (
            set "PY_BIN=py"
        )
    )
)

if "%PY_BIN%"=="" (
    echo [ERROR] Python not found! Please ensure Python is installed.
    pause
    exit /b 1
)

echo [*] Using Python: %PY_BIN%
echo [*] Starting Flask Backend on http://127.0.0.1:5000 ...
echo [*] Opening SkillSync web interface in your default browser...

:: Open browser after 2 seconds in background
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5000"

:: Start Flask server
"%PY_BIN%" server.py

pause

