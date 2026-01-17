# Docker Execution Instructions

Comprehensive guide for running the File Transfer System components using Docker and Docker Compose.

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM and 1GB disk space

### Build the Image
```bash
# Build the Docker image
docker-compose build

# Or build manually
docker build -t file-transfer-system .
```

## 🚀 Running Components

### Helper Scripts (Recommended)

The easiest way to run components is using the provided helper scripts:

#### Linux/macOS
```bash
# Setup environment
./docker-scripts/setup.sh

# Run basic implementation
./docker-scripts/run-before.sh

# Run robust implementation  
./docker-scripts/run-after.sh

# Run tests
./docker-scripts/run-tests.sh [quick|full|functionality|performance|error]

# Run evaluation
./docker-scripts/run-evaluation.sh [quick|comprehensive|requirements|functionality|performance|reliability|comparison]

# Interactive demo
./docker-scripts/demo.sh [quick|comprehensive|comparison|interactive]

# Cleanup
./docker-scripts/cleanup.sh [light|standard|deep|reset]

# Test all workflows
./docker-scripts/test-docker-workflows.sh
```

#### Windows
```cmd
REM Setup environment
docker-scripts\setup.bat

REM Run basic implementation
docker-scripts\run-before.bat

REM Run robust implementation
docker-scripts\run-after.bat

REM Cleanup
docker-scripts\cleanup.bat
```

### 1. Basic Implementation (repository_before)

#### Start Basic Server
```bash
# Using Docker Compose (recommended)
docker-compose up server-before

# Or using Docker directly
docker run -p 9998:9999 -v $(pwd)/server_files:/app/server_files file-transfer-system python repository_before/server.py
```

#### Test Basic Client
```bash
# Create a test file first
echo "Hello from basic implementation!" > server_files/test.txt

# Run client (in another terminal)
docker-compose --profile client up client-before

# Or using Docker directly
docker run --network file-transfer-system_file-transfer-net -v $(pwd)/client_downloads:/app/client_downloads file-transfer-system python repository_before/client.py test.txt server-before 9999
```

### 2. Robust Implementation (repository_after)

#### Start Robust Server
```bash
# Using Docker Compose (recommended)
docker-compose up server-after

# Or using Docker directly
docker run -p 9999:9999 -v $(pwd)/server_files:/app/server_files -v $(pwd)/logs:/app/logs file-transfer-system python repository_after/server.py
```

#### Test Robust Client
```bash
# Create test files
echo "Hello from robust implementation!" > server_files/test.txt
echo "Binary data test" > server_files/binary.bin

# Run client (in another terminal)
docker-compose --profile client up client-after

# Or using Docker directly
docker run --network file-transfer-system_file-transfer-net -v $(pwd)/client_downloads:/app/client_downloads -v $(pwd)/logs:/app/logs file-transfer-system python repository_after/client.py test.txt server-after 9999
```

### 3. Testing Components

#### Run All Tests
```bash
# Comprehensive test suite
docker-compose --profile test up test-runner

# Quick tests only
docker-compose --profile test up quick-test

# Or using Docker directly
docker run -v $(pwd)/tests:/app/tests -v $(pwd)/repository_after:/app/repository_after file-transfer-system python tests/run_all_tests.py
```

#### Individual Test Categories
```bash
# Core functionality tests
docker run file-transfer-system python -m unittest tests.test_file_transfer

# Performance tests
docker run file-transfer-system python -m unittest tests.test_performance

# Error handling tests
docker run file-transfer-system python -m unittest tests.test_error_handling
```

### 4. Evaluation Components

#### Comprehensive Evaluation
```bash
# Full evaluation suite
docker-compose --profile eval up evaluator

# Quick evaluation
docker-compose --profile eval up quick-eval

# Or using Docker directly
docker run -v $(pwd)/evaluation:/app/evaluation -v $(pwd)/repository_before:/app/repository_before -v $(pwd)/repository_after:/app/repository_after file-transfer-system python evaluation/evaluation.py
```

#### Custom Evaluation
```bash
# Requirements compliance only
docker run file-transfer-system python evaluation/run_evaluation.py --custom requirements

# Performance evaluation only
docker run file-transfer-system python evaluation/run_evaluation.py --custom performance

# Multiple categories
docker run file-transfer-system python evaluation/run_evaluation.py --custom requirements functionality performance
```

## 📋 Complete Workflows

### Workflow 1: Compare Before vs After

```bash
# Terminal 1: Start basic server
docker-compose up server-before

# Terminal 2: Test basic implementation
echo "Test file for comparison" > server_files/comparison.txt
docker-compose --profile client run --rm client-before python repository_before/client.py comparison.txt server-before 9999

# Terminal 3: Start robust server (different port)
docker-compose up server-after

# Terminal 4: Test robust implementation
docker-compose --profile client run --rm client-after python repository_after/client.py comparison.txt server-after 9999

# Compare the results and logs
ls -la client_downloads/
ls -la logs/
```

### Workflow 2: Concurrent Client Testing

```bash
# Terminal 1: Start robust server
docker-compose up server-after

# Terminal 2: Create multiple test files
for i in {1..5}; do echo "Test file $i content" > server_files/test$i.txt; done

# Terminal 3: Run multiple concurrent clients
for i in {1..5}; do
  docker-compose --profile client run --rm -d client-after python repository_after/client.py test$i.txt server-after 9999
done

# Monitor the server logs to see concurrent handling
docker-compose logs -f server-after
```

### Workflow 3: Complete Evaluation Pipeline

```bash
# Step 1: Build and prepare
docker-compose build
mkdir -p server_files client_downloads logs evaluation/reports

# Step 2: Create test files
echo "Small test file" > server_files/small.txt
dd if=/dev/zero of=server_files/large.bin bs=1024 count=1024  # 1MB file

# Step 3: Run quick evaluation
docker-compose --profile eval up quick-eval

# Step 4: Run comprehensive evaluation
docker-compose --profile eval up evaluator

# Step 5: Check results
ls -la evaluation/reports/
cat evaluation/reports/*/report.json | jq '.overall_score'
```

## 🔧 Advanced Usage

### Custom Docker Commands

#### Interactive Container
```bash
# Start interactive container for debugging
docker run -it --rm -v $(pwd):/app file-transfer-system bash

# Inside container, you can run any component
python repository_after/server.py &
python repository_after/client.py test.txt localhost 9999
```

#### Development Mode
```bash
# Mount source code for development
docker run -it --rm \
  -v $(pwd)/repository_after:/app/repository_after \
  -v $(pwd)/tests:/app/tests \
  -v $(pwd)/evaluation:/app/evaluation \
  -p 9999:9999 \
  file-transfer-system bash
```

#### Custom Network Testing
```bash
# Create custom network
docker network create file-transfer-test

# Run server on custom network
docker run -d --name ft-server --network file-transfer-test -p 9999:9999 file-transfer-system python repository_after/server.py

# Run client on same network
docker run --rm --network file-transfer-test -v $(pwd)/client_downloads:/app/client_downloads file-transfer-system python repository_after/client.py test.txt ft-server 9999

# Cleanup
docker stop ft-server
docker network rm file-transfer-test
```

### Performance Testing

#### Memory Usage Monitoring
```bash
# Run with memory limits
docker run --memory=256m --memory-swap=256m file-transfer-system python evaluation/run_evaluation.py --custom performance

# Monitor resource usage
docker stats $(docker ps -q --filter ancestor=file-transfer-system)
```

#### Stress Testing
```bash
# Create large test file
docker run --rm -v $(pwd)/server_files:/app/server_files file-transfer-system dd if=/dev/zero of=/app/server_files/stress.bin bs=1M count=100

# Run stress test
docker-compose up server-after &
for i in {1..10}; do
  docker-compose --profile client run --rm -d client-after python repository_after/client.py stress.bin server-after 9999
done
```

## 🐛 Debugging and Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :9999

# Use different port
docker run -p 9998:9999 file-transfer-system python repository_after/server.py
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER server_files client_downloads logs

# Or run with user mapping
docker run --user $(id -u):$(id -g) -v $(pwd):/app file-transfer-system python repository_after/server.py
```

#### Network Connectivity
```bash
# Test network connectivity
docker run --rm --network file-transfer-system_file-transfer-net file-transfer-system ping server-after

# Check container logs
docker-compose logs server-after
docker-compose logs client-after
```

### Debug Mode

#### Enable Verbose Logging
```bash
# Set debug environment
docker run -e PYTHONPATH=/app -e DEBUG=1 file-transfer-system python repository_after/server.py

# Or modify docker-compose.yml to add:
# environment:
#   - DEBUG=1
#   - LOGLEVEL=DEBUG
```

#### Container Inspection
```bash
# Inspect running container
docker exec -it $(docker-compose ps -q server-after) bash

# Check processes
docker exec $(docker-compose ps -q server-after) ps aux

# Check network
docker exec $(docker-compose ps -q server-after) netstat -tulpn
```

## 📊 Monitoring and Logs

### Log Management
```bash
# View real-time logs
docker-compose logs -f server-after

# View specific service logs
docker-compose logs evaluator

# Export logs
docker-compose logs server-after > server-logs.txt
```

### Performance Monitoring
```bash
# Monitor resource usage
docker stats

# Monitor specific container
docker stats $(docker-compose ps -q server-after)

# Get container info
docker inspect $(docker-compose ps -q server-after)
```

## 🔄 Cleanup

### Using Helper Scripts (Recommended)
```bash
# Light cleanup - stop containers only
./docker-scripts/cleanup.sh light

# Standard cleanup - stop containers, clean downloads/logs
./docker-scripts/cleanup.sh standard

# Deep cleanup - remove images, clean all generated files
./docker-scripts/cleanup.sh deep

# Complete reset - remove everything
./docker-scripts/cleanup.sh reset
```

### Manual Cleanup
```bash
# Stop all services
docker-compose down

# Stop specific service
docker-compose stop server-after

# Force stop and remove
docker-compose down --remove-orphans
```

### Clean Up Resources
```bash
# Remove containers
docker-compose down --volumes

# Remove images
docker rmi file-transfer-system

# Clean up Docker system
docker system prune -a

# Clean up project files
rm -rf client_downloads/* logs/* evaluation/reports/*
```

## 🚀 Production Deployment

### Multi-Stage Build
```dockerfile
# Create optimized production image
FROM python:3.11-slim as production

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY repository_after/ ./
RUN mkdir -p server_files logs

EXPOSE 9999
CMD ["python", "server.py"]
```

### Docker Swarm Deployment
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml file-transfer

# Scale services
docker service scale file-transfer_server-after=3
```

### Health Checks
```yaml
# Add to docker-compose.yml
healthcheck:
  test: ["CMD", "python", "-c", "import socket; s=socket.socket(); s.connect(('localhost', 9999)); s.close()"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## 📋 Environment Variables

### Configuration Options
```bash
# Server configuration
export SERVER_PORT=9999
export SERVER_HOST=0.0.0.0
export BUFFER_SIZE=4096
export LOG_LEVEL=INFO

# Client configuration
export CLIENT_TIMEOUT=10
export MAX_RETRIES=5
export DOWNLOAD_DIR=/app/client_downloads

# Evaluation configuration
export EVAL_PORT=18999
export EVAL_TIMEOUT=30
```

### Docker Environment File
```bash
# Create .env file
cat > .env << EOF
SERVER_PORT=9999
CLIENT_TIMEOUT=10
LOG_LEVEL=INFO
PYTHONUNBUFFERED=1
EOF

# Use with docker-compose
docker-compose --env-file .env up
```

## 🎯 Best Practices

### Security
- Use non-root user in containers
- Limit container resources
- Use read-only file systems where possible
- Scan images for vulnerabilities

### Performance
- Use multi-stage builds for smaller images
- Optimize layer caching
- Use appropriate resource limits
- Monitor container metrics

### Development
- Use bind mounts for development
- Implement proper health checks
- Use consistent naming conventions
- Document all environment variables

This comprehensive guide covers all aspects of running the File Transfer System components using Docker, from basic usage to advanced deployment scenarios.

## 🛠️ Helper Scripts

The `docker-scripts/` directory contains helper scripts that simplify Docker operations:

### Available Scripts

#### Setup and Execution
- **`setup.sh`** / **`setup.bat`** - Initialize environment and build images
- **`run-before.sh`** / **`run-before.bat`** - Start basic implementation server
- **`run-after.sh`** / **`run-after.bat`** - Start robust implementation server
- **`run-tests.sh`** - Execute test suite with various options
- **`run-evaluation.sh`** - Run evaluation suite with various options

#### Utilities
- **`cleanup.sh`** / **`cleanup.bat`** - Clean up resources (multiple levels)
- **`demo.sh`** - Interactive demonstration (Linux/macOS only)
- **`test-docker-workflows.sh`** - End-to-end workflow testing

### Quick Start with Helper Scripts

```bash
# 1. Setup (one-time)
./docker-scripts/setup.sh

# 2. Run robust server
./docker-scripts/run-after.sh

# 3. In another terminal, run tests
./docker-scripts/run-tests.sh quick

# 4. Run evaluation
./docker-scripts/run-evaluation.sh quick

# 5. Cleanup when done
./docker-scripts/cleanup.sh standard
```

### Script Features

#### Enhanced Error Handling
- Automatic prerequisite checking
- Graceful failure handling
- Colored output for better readability
- Progress indicators

#### Flexible Options
- Multiple test types (quick, full, functionality, performance, error)
- Multiple evaluation types (quick, comprehensive, requirements, etc.)
- Multiple cleanup levels (light, standard, deep, reset)

#### Cross-Platform Support
- Shell scripts for Linux/macOS
- Batch files for Windows
- Consistent interface across platforms

### Testing All Workflows

Run the comprehensive workflow test to verify everything works:

```bash
./docker-scripts/test-docker-workflows.sh
```

This script tests:
- Docker installation and availability
- Image building and setup
- Server functionality (basic and robust)
- Client file transfer
- Test suite execution
- Evaluation suite execution
- Cleanup functionality
- Error handling

### Script Documentation

For detailed information about each script, see:
- `docker-scripts/README.md` - Comprehensive script documentation
- Individual script help: `./docker-scripts/[script-name].sh --help`

## 🎯 Recommended Workflows

### Development Workflow
```bash
# Setup once
./docker-scripts/setup.sh

# Development cycle
./docker-scripts/run-after.sh &          # Start server
./docker-scripts/run-tests.sh quick     # Quick tests
# Make changes...
./docker-scripts/run-tests.sh quick     # Test again
./docker-scripts/cleanup.sh light       # Stop containers
```

### CI/CD Workflow
```bash
./docker-scripts/setup.sh
./docker-scripts/run-tests.sh full
./docker-scripts/run-evaluation.sh comprehensive
./docker-scripts/cleanup.sh standard
```

### Demo Workflow
```bash
./docker-scripts/setup.sh
./docker-scripts/demo.sh comprehensive  # Full demo
./docker-scripts/cleanup.sh standard
```

This comprehensive Docker setup provides multiple ways to interact with the File Transfer System, from simple helper scripts to advanced Docker configurations, ensuring ease of use across different platforms and use cases.