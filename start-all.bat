@echo off
echo =======================================
echo Starting Chocolate E-Commerce Full Stack
echo =======================================

:: Set directories
set "API_DIR=%~dp0"
set "FRONTEND_DIR=%API_DIR%chocolate-store"

echo API directory: %API_DIR%
echo Frontend directory: %FRONTEND_DIR%
echo.

:: Start the API
echo Starting API...
start "API" cmd /k "cd /d "%API_DIR%" && dotnet run --launch-profile http"

:: Wait for API to start
echo Waiting for API to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

:: Start the Next.js frontend
echo Starting Next.js frontend...
start "Next.js Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo Applications started:
echo API: http://localhost:5202
echo Frontend: http://localhost:3000
echo.
echo Close the command windows to stop the applications.
echo.
pause