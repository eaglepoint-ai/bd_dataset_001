# Basic File Transfer System

A simple TCP socket-based file transfer system.

## Features

- Basic TCP socket communication
- Single-threaded server
- Simple file transfer
- Basic error handling

## Usage

### Server
```bash
python server.py [port]
```

### Client
```bash
python client.py <filename> [host] [port]
```

## Limitations

- No concurrent client support
- No progress tracking
- No file integrity verification
- No retry logic
- Basic error handling
- No logging system
- No graceful shutdown