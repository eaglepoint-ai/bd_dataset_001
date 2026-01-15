# System Architecture

## Overview

This file transfer system implements a client-server architecture using TCP sockets with multi-threading support, retry logic, and integrity verification.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ FileTransferClient                                        │  │
│  │                                                            │  │
│  │  • Connection with Retry Logic (Exponential Backoff)     │  │
│  │  • File Request Handler                                   │  │
│  │  • Progress Bar Display                                   │  │
│  │  • Checksum Verification                                  │  │
│  │  • Error Handling & Recovery                              │  │
│  │  • Logging System                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│                    TCP Socket Connection                         │
│                            ↓                                     │
└─────────────────────────────────────────────────────────────────┘
                             ↓
                    Internet/Network
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ FileTransferServer (Main Thread)                          │  │
│  │                                                            │  │
│  │  • Socket Listener (0.0.0.0:PORT)                        │  │
│  │  • Connection Acceptor                                    │  │
│  │  • Thread Manager                                         │  │
│  │  • Graceful Shutdown Handler                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│              Spawns Thread for Each Client                       │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Client Handler Thread 1  │  Thread 2  │  Thread 3  │ ... │  │
│  │                                                            │  │
│  │  • Receive File Request                                   │  │
│  │  • Validate File Exists                                   │  │
│  │  • Calculate Checksum                                     │  │
│  │  • Send File Metadata                                     │  │
│  │  • Stream File Data                                       │  │
│  │  • Track Progress                                         │  │
│  │  • Log Operations                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Client Components

#### 1. Connection Manager
- **Retry Logic**: Attempts connection up to 5 times
- **Exponential Backoff**: 1s → 2s → 4s → 8s → 16s → 32s (max)
- **Timeout**: 10-second socket timeout per attempt

#### 2. File Receiver
- **Request Protocol**: Sends filename with length prefix
- **Metadata Reception**: Receives filename, size, checksum
- **Streaming Download**: Receives file in 4KB chunks
- **Progress Tracking**: Real-time progress bar with MB display

#### 3. Integrity Verifier
- **Algorithm**: MD5 checksum
- **Verification**: Compares received vs. expected checksum
- **Error Handling**: Reports mismatches clearly

#### 4. Logger
- **File Logging**: Timestamped log files in `logs/`
- **Console Output**: Real-time status updates
- **Log Levels**: INFO, WARNING, ERROR

### Server Components

#### 1. Main Server Thread
- **Socket Binding**: Binds to configurable host:port
- **Listen Queue**: Accepts up to 5 pending connections
- **Accept Loop**: Continuously accepts new connections
- **Thread Spawning**: Creates new thread per client

#### 2. Client Handler Threads
- **Isolation**: Each client handled independently
- **File Validation**: Checks file existence before transfer
- **Checksum Calculation**: Computes MD5 before sending
- **Progress Logging**: Logs every 10% of transfer
- **Cleanup**: Closes connection after transfer

#### 3. Thread Manager
- **Active Tracking**: Maintains list of active connections
- **Thread Safety**: Uses locks for shared resources
- **Graceful Shutdown**: Closes all connections on exit

#### 4. Logger
- **Thread-Safe**: Handles concurrent logging
- **File Logging**: Timestamped log files in `logs/`
- **Console Output**: Real-time status updates

## Protocol Specification

### Phase 1: Connection Establishment
```
Client                          Server
  |                               |
  |-------- TCP Connect --------->|
  |<------- TCP Accept -----------|
  |                               |
```

### Phase 2: File Request
```
Client                          Server
  |                               |
  |-- [4B: len][filename] ------->|
  |                               |
  |                          (validate file)
  |                               |
  |<-------- "OK" or "ERROR" -----|
  |                               |
```

### Phase 3: Metadata Transfer (if OK)
```
Client                          Server
  |                               |
  |<-- [4B: filename len] --------|
  |<-- [filename] ----------------|
  |<-- [8B: file size] -----------|
  |<-- [32B: MD5 checksum] -------|
  |                               |
```

### Phase 4: File Data Transfer
```
Client                          Server
  |                               |
  |<-- [4KB chunk] ---------------|
  |<-- [4KB chunk] ---------------|
  |<-- [4KB chunk] ---------------|
  |       ...                     |
  |<-- [last chunk] --------------|
  |                               |
```

### Phase 5: Verification & Cleanup
```
Client                          Server
  |                               |
(calculate checksum)              |
(verify integrity)                |
  |                               |
  |-------- TCP Close ----------->|
  |<------- TCP Close -----------|
  |                               |
```

## Data Structures

### File Metadata Packet
```python
struct.pack('!I', filename_length)  # 4 bytes: unsigned int
filename.encode('utf-8')             # Variable: UTF-8 string
struct.pack('!Q', file_size)        # 8 bytes: unsigned long long
checksum.encode('utf-8')             # 32 bytes: hex string
```

### Progress Tracking
```python
{
    'bytes_sent': int,      # Total bytes transferred
    'total_size': int,      # Total file size
    'percentage': float,    # Progress percentage
    'last_logged': int      # Last logged percentage
}
```

## Threading Model

### Server Threading
```
Main Thread
├── Socket Listener (blocking with timeout)
├── Signal Handler (SIGINT)
└── Spawns: Client Handler Threads (daemon)
    ├── Thread 1: handle_client(socket1, addr1)
    ├── Thread 2: handle_client(socket2, addr2)
    ├── Thread 3: handle_client(socket3, addr3)
    └── ...
```

### Thread Safety
- **Shared Resource**: `active_connections` list
- **Protection**: `threading.Lock()`
- **Operations**: Add/remove connections atomically

## Error Handling Strategy

### Client Errors
1. **Connection Failure**: Retry with exponential backoff
2. **Network Timeout**: Log error, close connection
3. **Checksum Mismatch**: Report failure, keep file
4. **Interrupted Transfer**: Log warning, partial file remains
5. **SIGINT**: Graceful shutdown, log interruption

### Server Errors
1. **File Not Found**: Send ERROR response with message
2. **Read Error**: Log error, close connection
3. **Network Error**: Log error, close connection
4. **Thread Error**: Log error, thread terminates
5. **SIGINT**: Close all connections, shutdown gracefully

## Logging Strategy

### Log Levels
- **INFO**: Normal operations (connections, transfers, progress)
- **WARNING**: Recoverable issues (retries, file not found)
- **ERROR**: Serious issues (network errors, checksum failures)

### Log Format
```
YYYY-MM-DD HH:MM:SS - ThreadName - LEVEL - Message
```

### Log Files
- **Server**: `logs/server_YYYYMMDD_HHMMSS.log`
- **Client**: `logs/client_YYYYMMDD_HHMMSS.log`

## Performance Considerations

### Buffer Size
- **4KB chunks**: Balance between memory and performance
- **Adjustable**: Can be increased for faster transfers

### Threading
- **Concurrent Clients**: Limited by system resources
- **Daemon Threads**: Automatically cleaned up on exit

### Network
- **TCP**: Reliable, ordered delivery
- **Timeout**: Prevents indefinite blocking
- **Backoff**: Reduces server load during retries

## Security Considerations

### Current Implementation
- **No Authentication**: Anyone can connect
- **No Encryption**: Data sent in plaintext
- **No Authorization**: All files accessible
- **No Rate Limiting**: Unlimited requests

### Recommended Enhancements
1. Add TLS/SSL encryption
2. Implement user authentication
3. Add file access control lists
4. Implement rate limiting
5. Validate file paths (prevent directory traversal)
6. Add request signing/verification

## Scalability

### Current Limits
- **Concurrent Clients**: ~100-1000 (OS dependent)
- **File Size**: Limited by disk space
- **Network**: Limited by bandwidth

### Scaling Strategies
1. **Process Pool**: Use multiprocessing instead of threading
2. **Async I/O**: Use asyncio for better concurrency
3. **Load Balancer**: Distribute across multiple servers
4. **Chunked Transfer**: Support resume/partial downloads
5. **Compression**: Add optional compression

## Testing Strategy

### Unit Tests
- Connection establishment
- File transfer
- Checksum verification
- Error handling

### Integration Tests
- End-to-end file transfer
- Multiple concurrent clients
- Retry logic
- Graceful shutdown

### Performance Tests
- Large file transfers
- Many concurrent clients
- Network latency simulation
- Bandwidth throttling

## Future Enhancements

1. **Resume Support**: Allow resuming interrupted transfers
2. **Compression**: Optional gzip compression
3. **Directory Transfer**: Support transferring entire directories
4. **Bidirectional**: Allow client to send files to server
5. **Web Interface**: Add HTTP API for browser access
6. **Encryption**: Add TLS/SSL support
7. **Authentication**: Add user/password authentication
8. **Progress Callback**: Allow custom progress handlers
9. **Bandwidth Limiting**: Throttle transfer speed
10. **IPv6 Support**: Add IPv6 compatibility
