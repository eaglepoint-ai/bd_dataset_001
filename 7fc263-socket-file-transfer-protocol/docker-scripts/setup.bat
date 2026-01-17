@echo off
REM Docker Setup Script for File Transfer System (Windows)

echo File Transfer System - Docker Setup
echo ====================================

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

echo [INFO] Docker and Docker Compose are available

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "server_files" mkdir server_files
if not exist "client_downloads" mkdir client_downloads
if not exist "logs" mkdir logs
if not exist "evaluation\reports" mkdir evaluation\reports

REM Create test files
echo [INFO] Creating test files...
echo Hello, World! This is a test file for the basic implementation. > server_files\test.txt
echo This is a small test file. > server_files\small.txt
echo This is a medium-sized test file with more content to test the file transfer system capabilities. > server_files\medium.txt

REM Create binary test file using Python
echo [INFO] Creating binary test file...
python -c "import os; f=open('server_files/large.bin', 'wb'); f.write(os.urandom(1024*1024)); f.close(); print('Created 1MB binary test file')"

REM Create JSON test file
echo [INFO] Creating JSON test file...
(
echo {
echo   "test": true,
echo   "message": "This is a JSON test file",
echo   "data": {
echo     "numbers": [1, 2, 3, 4, 5],
echo     "strings": ["hello", "world", "test"],
echo     "nested": {
echo       "key": "value",
echo       "array": [10, 20, 30]
echo     }
echo   },
echo   "timestamp": "%date% %time%"
echo }
) > server_files\data.json

REM Build Docker image
echo [INFO] Building Docker image...
docker-compose build
if errorlevel 1 (
    echo [ERROR] Failed to build Docker image
    exit /b 1
)

echo [INFO] Docker image built successfully

echo [INFO] Setup completed successfully!
echo.
echo Available commands:
echo   docker-scripts\run-before.bat     - Run basic implementation
echo   docker-scripts\run-after.bat      - Run robust implementation
echo   docker-scripts\run-tests.bat      - Run test suite
echo   docker-scripts\run-evaluation.bat - Run evaluation
echo   docker-scripts\cleanup.bat        - Clean up resources
echo.
echo Or use Docker Compose directly:
echo   docker-compose up server-after     - Start robust server
echo   docker-compose --profile test up   - Run tests
echo   docker-compose --profile eval up   - Run evaluation

pause