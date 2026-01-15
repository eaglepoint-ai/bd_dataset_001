# Robust File Transfer System

A production-ready TCP socket-based file transfer system with multi-threaded server and resilient client implementation.

## Features

### Server (`server.py`)
- **Multi-threaded**: Handles multiple concurrent clients using threading
- **Progress Tracking**: Logs transfer progress every 10%
- **Configurable Port**: Accept custom port via command line
- **File Integrity**: Calculates MD5 checksums for verification
- **Comprehensive Logging**: All operations logged to timestamped files
- **Graceful Shutdown**: Handles SIGINT (Ctrl+C) cleanly
- **Error Handling**: Robust error handling for network issues

### Client (`client.py`)
- **Retry Logic**: Exponential backoff (1s → 2s → 4s → 8s → 16s → 32s max)
- **Real-time Progress Bar**: Visual progress display with MB transferred
- **Checksum Verification**: Validates file integrity after download
- **Network Timeout Handling**: 10-second socket timeout with error recovery
- **Command-line Arguments**: Flexible host/port/filename specification
- **Comprehensive Logging**: All operations logged to timestamped files
- **Graceful Shutdown**: Handles SIGINT (Ctrl+C) cleanly

## Installation

No external dependencies required - uses Python standard library only.

```bash
# Ensure Python 3.6+ is installed
python3 --version
```

## Usage

### Starting the Server

```bash
# Default port (9999)
python server.py

# Custom port
python server.py 8080
```

The server will:
- Create `server_files/` directory for files to serve
- Create `logs/` directory for operation logs
- Listen for incoming connections
- Handle multiple clients concurrently

### Running the Client

```bash
# Basic usage (localhost:9999)
python client.py filename.txt

# Specify host
python client.py filename.txt 192.168.1.100

# Specify host and port
python client.py filename.txt 192.168.1.100 8080
```

The client will:
- Create `client_downloads/` directory for received files
- Create `logs/` directory for operation logs
- Attempt connection with retry logic
- Display real-time progress bar
- Verify file integrity with checksum

## Directory Structure

```
.
├── server.py                 # Server script
├── client.py                 # Client script
├── README.md                 # This file
├── server_files/             # Place files here to serve (created automatically)
├── client_downloads/         # Downloaded files stored here (created automatically)
└── logs/                     # Operation logs (created automatically)
    ├── server_YYYYMMDD_HHMMSS.log
    └── client_YYYYMMDD_HHMMSS.log
```

## Example Workflow

1. **Prepare a file on the server:**
```bash
# Create a test file
echo "Hello, World!" > server_files/test.txt

# Or copy an existing file
cp /path/to/myfile.pdf server_files/
```

2. **Start the server:**
```bash
python server.py
```

3. **Download from client (in another terminal):**
```bash
python client.py test.txt
```

## Technical Details

### Protocol Specification

**Client Request:**
```
[4 bytes: filename length (uint32)] + [filename (UTF-8)]
```

**Server Response:**
```
[2 bytes: "OK" or 5 bytes: "ERROR" + error message]

If OK:
[4 bytes: filename length (uint32)]
[filename (UTF-8)]
[8 bytes: file size (uint64)]
[32 bytes: MD5 checksum (hex string)]
[file data in chunks]
```

### Configuration

Edit these constants in the scripts:

**Server:**
- `DEFAULT_PORT`: Default listening port (9999)
- `BUFFER_SIZE`: Chunk size for file transfer (4096 bytes)
- `SERVER_FILES_DIR`: Directory containing files to serve

**Client:**
- `DEFAULT_HOST`: Default server host (localhost)
- `DEFAULT_PORT`: Default server port (9999)
- `BUFFER_SIZE`: Chunk size for file transfer (4096 bytes)
- `MAX_RETRIES`: Maximum connection attempts (5)
- `INITIAL_BACKOFF`: Initial retry delay (1 second)
- `MAX_BACKOFF`: Maximum retry delay (32 seconds)

### Error Handling

Both scripts handle:
- Network timeouts
- Connection failures
- Interrupted transfers
- File not found errors
- Checksum mismatches
- Graceful shutdown (SIGINT)

### Logging

All operations are logged with timestamps:
- Connection events
- File transfer progress
- Errors and warnings
- Checksum verification results

Logs are stored in `logs/` directory with timestamps in filenames.

## Testing

### Test Multiple Concurrent Clients

```bash
# Terminal 1: Start server
python server.py

# Terminal 2-4: Start multiple clients simultaneously
python client.py file1.txt &
python client.py file2.txt &
python client.py file3.txt &
```

### Test Retry Logic

```bash
# Start client before server to test retry
python client.py test.txt

# Start server within 63 seconds (sum of backoff times)
python server.py
```

### Test Graceful Shutdown

Press `Ctrl+C` during transfer to test graceful shutdown handling.

## Requirements

- Python 3.6 or higher
- TCP network connectivity between client and server
- Sufficient disk space for file transfers

## Security Considerations

This is a basic implementation for educational/internal use. For production:
- Add authentication/authorization
- Implement encryption (TLS/SSL)
- Add rate limiting
- Validate file paths to prevent directory traversal
- Implement access control lists

## License

MIT License - Free to use and modify.
