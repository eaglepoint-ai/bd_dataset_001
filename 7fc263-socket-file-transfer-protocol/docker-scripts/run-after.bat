@echo off
REM Run Robust Implementation (repository_after) - Windows

echo File Transfer System - Robust Implementation
echo ============================================

REM Check if setup was run
if not exist "server_files\test.txt" (
    echo [WARN] Test files not found. Running setup first...
    call docker-scripts\setup.bat
)

echo [INFO] Starting robust implementation server...
echo [INFO] Server will be available on port 9999
echo [INFO] Features: Multi-threading, Progress tracking, Retry logic, Checksums
echo [INFO] Press Ctrl+C to stop the server
echo.

REM Start the robust server
docker-compose up server-after