# Docker Scripts

This directory contains helper scripts for managing the File Transfer System Docker environment.

## Scripts Overview

### Setup Scripts
- **`setup.sh`** / **`setup.bat`** - Initial environment setup
  - Creates necessary directories
  - Generates test files
  - Builds Docker images
  - Validates Docker installation

### Execution Scripts
- **`run-before.sh`** / **`run-before.bat`** - Run basic implementation
- **`run-after.sh`** / **`run-after.bat`** - Run robust implementation
- **`run-tests.sh`** / **`run-tests.bat`** - Execute test suite
- **`run-evaluation.sh`** / **`run-evaluation.bat`** - Run evaluation

### Utility Scripts
- **`cleanup.sh`** / **`cleanup.bat`** - Clean up resources
- **`demo.sh`** - Interactive demonstration (Linux/macOS only)

## Quick Start

### Linux/macOS
```bash
# Make scripts executable
chmod +x docker-scripts/*.sh

# Setup environment
./docker-scripts/setup.sh

# Run robust implementation
./docker-scripts/run-after.sh

# Run tests
./docker-scripts/run-tests.sh

# Run evaluation
./docker-scripts/run-evaluation.sh

# Cleanup
./docker-scripts/cleanup.sh
```

### Windows
```cmd
REM Setup environment
docker-scripts\setup.bat

REM Run robust implementation
docker-scripts\run-after.bat

REM Run tests
docker-scripts\run-tests.bat

REM Run evaluation
docker-scripts\run-evaluation.bat

REM Cleanup
docker-scripts\cleanup.bat
```

## Script Details

### setup.sh / setup.bat
**Purpose**: Initialize the Docker environment

**Actions**:
- Validates Docker and Docker Compose installation
- Creates directory structure (server_files, client_downloads, logs, evaluation/reports)
- Generates test files (text, binary, JSON)
- Builds Docker image
- Sets proper permissions

**Usage**:
```bash
./docker-scripts/setup.sh
```

### run-before.sh / run-before.bat
**Purpose**: Start the basic implementation server

**Features**:
- Runs repository_before/server.py
- Available on port 9998
- Basic file transfer functionality
- Minimal logging

**Usage**:
```bash
./docker-scripts/run-before.sh
```

### run-after.sh / run-after.bat
**Purpose**: Start the robust implementation server

**Features**:
- Runs repository_after/server.py
- Available on port 9999
- Multi-threading support
- Progress tracking
- Retry logic
- Checksum verification
- Comprehensive logging

**Usage**:
```bash
./docker-scripts/run-after.sh
```

### run-tests.sh / run-tests.bat
**Purpose**: Execute the test suite

**Test Types**:
- `quick` - Quick validation tests (2-3 minutes)
- `full/all` - Complete test suite (10-15 minutes)
- `functionality` - Core functionality tests only
- `performance` - Performance tests only
- `error` - Error handling tests only

**Usage**:
```bash
./docker-scripts/run-tests.sh [quick|full|functionality|performance|error]
```

**Examples**:
```bash
./docker-scripts/run-tests.sh quick        # Quick tests
./docker-scripts/run-tests.sh full         # All tests
./docker-scripts/run-tests.sh performance  # Performance only
```

### run-evaluation.sh / run-evaluation.bat
**Purpose**: Execute the evaluation suite

**Evaluation Types**:
- `quick` - Quick validation (2-3 minutes)
- `comprehensive` - Complete evaluation (10-15 minutes)
- `requirements` - Requirements compliance only
- `functionality` - Core functionality evaluation
- `performance` - Performance benchmarking
- `reliability` - Reliability assessment
- `comparison` - Before/after comparison

**Usage**:
```bash
./docker-scripts/run-evaluation.sh [quick|comprehensive|requirements|functionality|performance|reliability|comparison]
```

**Examples**:
```bash
./docker-scripts/run-evaluation.sh quick          # Quick evaluation
./docker-scripts/run-evaluation.sh comprehensive  # Full evaluation
./docker-scripts/run-evaluation.sh performance    # Performance only
```

### cleanup.sh / cleanup.bat
**Purpose**: Clean up Docker resources and generated files

**Cleanup Types**:
- `light` - Stop containers only
- `standard` - Stop containers, clean downloads/logs (default)
- `deep` - Remove images, clean all generated files
- `reset` - Complete reset, remove everything

**Usage**:
```bash
./docker-scripts/cleanup.sh [light|standard|deep|reset]
```

**Examples**:
```bash
./docker-scripts/cleanup.sh              # Standard cleanup
./docker-scripts/cleanup.sh light        # Just stop containers
./docker-scripts/cleanup.sh deep         # Remove images and files
./docker-scripts/cleanup.sh reset        # Complete reset
```

### demo.sh (Linux/macOS only)
**Purpose**: Interactive demonstration of system capabilities

**Demo Types**:
- `quick` - Quick functionality demo (5 minutes)
- `comprehensive` - Full feature showcase (15 minutes)
- `comparison` - Before/after comparison (10 minutes)
- `interactive` - Interactive demo menu

**Usage**:
```bash
./docker-scripts/demo.sh [quick|comprehensive|comparison|interactive]
```

## Environment Variables

The scripts support various environment variables for customization:

### Server Configuration
```bash
export SERVER_PORT=9999
export SERVER_HOST=0.0.0.0
export BUFFER_SIZE=4096
export LOG_LEVEL=INFO
```

### Client Configuration
```bash
export CLIENT_TIMEOUT=10
export MAX_RETRIES=5
export DOWNLOAD_DIR=/app/client_downloads
```

### Evaluation Configuration
```bash
export EVAL_PORT=18999
export EVAL_TIMEOUT=30
export TEST_MODE=comprehensive
```

## Troubleshooting

### Common Issues

#### Docker Not Running
```bash
# Check Docker status
docker info

# Start Docker (varies by system)
sudo systemctl start docker  # Linux
# or start Docker Desktop
```

#### Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :9999

# Kill process using port
sudo kill -9 $(lsof -t -i:9999)
```

#### Permission Issues
```bash
# Fix file permissions (Linux/macOS)
sudo chown -R $USER:$USER server_files client_downloads logs

# Or run with user mapping
docker run --user $(id -u):$(id -g) ...
```

#### Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

### Debug Mode

Enable verbose logging:
```bash
export DEBUG=1
export LOGLEVEL=DEBUG
./docker-scripts/run-after.sh
```

### Log Locations

- **Container logs**: `docker-compose logs [service-name]`
- **Application logs**: `logs/` directory
- **Evaluation reports**: `evaluation/reports/` directory

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: File Transfer System Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup environment
      run: ./docker-scripts/setup.sh
    - name: Run tests
      run: ./docker-scripts/run-tests.sh full
    - name: Run evaluation
      run: ./docker-scripts/run-evaluation.sh comprehensive
    - name: Upload reports
      uses: actions/upload-artifact@v2
      with:
        name: evaluation-reports
        path: evaluation/reports/
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('Setup') {
            steps {
                sh './docker-scripts/setup.sh'
            }
        }
        stage('Test') {
            steps {
                sh './docker-scripts/run-tests.sh full'
            }
        }
        stage('Evaluate') {
            steps {
                sh './docker-scripts/run-evaluation.sh comprehensive'
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'evaluation/reports/**/*', fingerprint: true
            sh './docker-scripts/cleanup.sh standard'
        }
    }
}
```

## Performance Considerations

### Resource Requirements
- **Minimum**: 2GB RAM, 1GB disk space
- **Recommended**: 4GB RAM, 2GB disk space
- **For stress testing**: 8GB RAM, 5GB disk space

### Optimization Tips
- Use `quick` test/evaluation modes for faster feedback
- Run `cleanup.sh light` between tests to save time
- Use Docker layer caching for faster builds
- Monitor resource usage with `docker stats`

## Security Considerations

- Scripts create files with appropriate permissions
- Docker containers run with non-root user when possible
- Network isolation through Docker networks
- No sensitive data in environment variables
- Regular cleanup of temporary files

## Contributing

When adding new scripts:
1. Follow the naming convention: `action-target.sh`
2. Include both Linux/macOS (.sh) and Windows (.bat) versions
3. Add comprehensive error handling
4. Include usage documentation
5. Test on multiple platforms
6. Update this README

## Support

For issues with Docker scripts:
1. Check the troubleshooting section above
2. Verify Docker and Docker Compose versions
3. Check container logs: `docker-compose logs [service]`
4. Review application logs in `logs/` directory
5. Try cleanup and rebuild: `./docker-scripts/cleanup.sh reset && ./docker-scripts/setup.sh`