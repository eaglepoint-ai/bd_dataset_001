@echo off
REM Cleanup Script for File Transfer System (Windows)

echo File Transfer System - Cleanup
echo ==============================

set CLEANUP_TYPE=%1
if "%CLEANUP_TYPE%"=="" set CLEANUP_TYPE=standard

if "%CLEANUP_TYPE%"=="light" goto light_cleanup
if "%CLEANUP_TYPE%"=="standard" goto standard_cleanup
if "%CLEANUP_TYPE%"=="deep" goto deep_cleanup
if "%CLEANUP_TYPE%"=="reset" goto reset_cleanup
goto show_usage

:light_cleanup
echo [INFO] Light cleanup - stopping containers only...
docker-compose down
goto end

:standard_cleanup
echo [INFO] Standard cleanup - containers, volumes, and generated files...

REM Stop and remove containers
echo [INFO] Stopping Docker containers...
docker-compose down --volumes --remove-orphans

REM Clean up generated files
echo [INFO] Cleaning up generated files...
if exist "client_downloads" del /q client_downloads\* 2>nul
if exist "logs" del /q logs\* 2>nul
if exist "evaluation\reports" for /d %%i in (evaluation\reports\*) do rmdir /s /q "%%i" 2>nul

echo [INFO] Preserving server test files, cleaning downloads...
goto end

:deep_cleanup
echo [INFO] Deep cleanup - everything including Docker images...

REM Stop and remove containers
echo [INFO] Stopping Docker containers...
docker-compose down --volumes --remove-orphans

REM Remove Docker images
echo [INFO] Removing Docker images...
docker rmi file-transfer-system 2>nul || echo [WARN] Image not found or in use

REM Clean up all generated files
echo [INFO] Cleaning up all generated files...
if exist "client_downloads" del /q client_downloads\* 2>nul
if exist "logs" del /q logs\* 2>nul
if exist "evaluation\reports" for /d %%i in (evaluation\reports\*) do rmdir /s /q "%%i" 2>nul
if exist "server_files" del /q server_files\* 2>nul

REM Clean up Docker system
echo [INFO] Cleaning up Docker system...
docker system prune -f
goto end

:reset_cleanup
echo [INFO] Complete reset - everything including Docker system...

REM Stop and remove containers
echo [INFO] Stopping Docker containers...
docker-compose down --volumes --remove-orphans

REM Remove Docker images
echo [INFO] Removing Docker images...
docker rmi file-transfer-system 2>nul || echo [WARN] Image not found or in use

REM Clean up all files
echo [INFO] Removing all generated files and directories...
if exist "client_downloads" rmdir /s /q client_downloads 2>nul
if exist "logs" rmdir /s /q logs 2>nul
if exist "evaluation\reports" rmdir /s /q evaluation\reports 2>nul
if exist "server_files" rmdir /s /q server_files 2>nul

REM Recreate directories
echo [INFO] Recreating clean directories...
mkdir client_downloads
mkdir logs
mkdir evaluation\reports
mkdir server_files

REM Clean up Docker system aggressively
echo [INFO] Aggressive Docker cleanup...
docker system prune -a -f --volumes
goto end

:show_usage
echo Usage: %0 [light^|standard^|deep^|reset]
echo.
echo Cleanup types:
echo   light     - Stop containers only
echo   standard  - Stop containers, clean downloads/logs (default)
echo   deep      - Remove images, clean all generated files
echo   reset     - Complete reset, remove everything
echo.
echo Examples:
echo   %0              # Standard cleanup
echo   %0 light        # Just stop containers
echo   %0 deep         # Remove images and files
echo   %0 reset        # Complete reset
exit /b 1

:end
echo [INFO] Cleanup completed!
echo.
echo Remaining Docker resources:
for /f %%i in ('docker images -q file-transfer-system 2^>nul ^| find /c /v ""') do echo   Images: %%i
for /f %%i in ('docker ps -a -q --filter ancestor=file-transfer-system 2^>nul ^| find /c /v ""') do echo   Containers: %%i

echo.
echo Directory sizes:
if exist "server_files" dir server_files | find "File(s)"
if exist "client_downloads" dir client_downloads | find "File(s)"
if exist "logs" dir logs | find "File(s)"

pause