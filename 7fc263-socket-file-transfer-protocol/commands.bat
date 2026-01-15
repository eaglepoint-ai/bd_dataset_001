@echo off
REM Helper commands for Windows - File Transfer System

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="setup" goto setup
if "%1"=="server" goto server
if "%1"=="client" goto client
if "%1"=="test" goto test
if "%1"=="clean" goto clean
goto help

:help
echo.
echo File Transfer System - Helper Commands
echo ======================================
echo.
echo Usage: commands.bat [command] [args]
echo.
echo Commands:
echo   setup          - Create test files
echo   server [port]  - Start server (default port: 9999)
echo   client [file] [host] [port] - Download file
echo   test           - Run automated tests
echo   clean          - Clean up downloads and logs
echo   help           - Show this help
echo.
echo Examples:
echo   commands.bat setup
echo   commands.bat server
echo   commands.bat server 8080
echo   commands.bat client small.txt
echo   commands.bat client file.txt 192.168.1.100 9999
echo   commands.bat test
echo   commands.bat clean
echo.
goto end

:setup
echo Creating test files...
python test_setup.py
goto end

:server
if "%2"=="" (
    echo Starting server on default port 9999...
    python server.py
) else (
    echo Starting server on port %2...
    python server.py %2
)
goto end

:client
if "%2"=="" (
    echo Error: Filename required
    echo Usage: commands.bat client [filename] [host] [port]
    goto end
)
if "%3"=="" (
    echo Downloading %2 from localhost:9999...
    python client.py %2
) else if "%4"=="" (
    echo Downloading %2 from %3:9999...
    python client.py %2 %3
) else (
    echo Downloading %2 from %3:%4...
    python client.py %2 %3 %4
)
goto end

:test
echo Running automated tests...
python run_tests.py
goto end

:clean
echo Cleaning up...
if exist client_downloads rmdir /s /q client_downloads
if exist logs rmdir /s /q logs
if exist server_files\*.txt del /q server_files\*.txt
if exist server_files\*.bin del /q server_files\*.bin
if exist server_files\*.json del /q server_files\*.json
echo Cleanup complete!
goto end

:end
