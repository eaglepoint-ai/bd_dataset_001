# Usage Examples

Real-world examples demonstrating the file transfer system.

## Example 1: Basic File Transfer

### Scenario
Transfer a single text file from server to client on the same machine.

### Steps

**Terminal 1 - Server:**
```bash
$ python server.py

============================================================
File Transfer Server Started
Listening on: 0.0.0.0:9999
Files directory: server_files
Press Ctrl+C to stop
============================================================

2026-01-15 10:30:15 - MainThread - INFO - Server initialized on 0.0.0.0:9999
2026-01-15 10:30:15 - MainThread - INFO - Server listening on 0.0.0.0:9999
```

**Terminal 2 - Client:**
```bash
$ python client.py document.txt

============================================================
File Transfer Client
Server: localhost:9999
Requesting: document.txt
Download directory: client_downloads
============================================================

2026-01-15 10:30:20 - INFO - Client initialized for localhost:9999
2026-01-15 10:30:20 - INFO - Connection attempt 1/5 to localhost:9999
2026-01-15 10:30:20 - INFO - Successfully connected to localhost:9999
2026-01-15 10:30:20 - INFO - Requested file: document.txt

Downloading: document.txt
Size: 0.05 MB
|██████████████████████████████████████████████████| 100.0% (0.05/0.05 MB)
Verifying file integrity...
✓ File downloaded successfully: client_downloads/document.txt
✓ Checksum verified: a1b2c3d4e5f6...
```

**Terminal 1 - Server (updated):**
```bash
2026-01-15 10:30:20 - Thread-1 - INFO - New connection from ('127.0.0.1', 54321)
2026-01-15 10:30:20 - Thread-1 - INFO - Client ('127.0.0.1', 54321) requested file: document.txt
2026-01-15 10:30:20 - Thread-1 - INFO - Sending file 'document.txt' (52428 bytes) to ('127.0.0.1', 54321)
2026-01-15 10:30:20 - Thread-1 - INFO - Progress to ('127.0.0.1', 54321): 10% (5242/52428 bytes)
2026-01-15 10:30:20 - Thread-1 - INFO - Progress to ('127.0.0.1', 54321): 20% (10485/52428 bytes)
...
2026-01-15 10:30:21 - Thread-1 - INFO - File 'document.txt' sent successfully to ('127.0.0.1', 54321)
2026-01-15 10:30:21 - Thread-1 - INFO - Connection closed with ('127.0.0.1', 54321)
```

---

## Example 2: Multiple Concurrent Transfers

### Scenario
Three clients downloading different files simultaneously.

### Steps

**Terminal 1 - Server:**
```bash
$ python server.py

============================================================
File Transfer Server Started
Listening on: 0.0.0.0:9999
Files directory: server_files
Press Ctrl+C to stop
============================================================
```

**Terminal 2 - Client 1:**
```bash
$ python client.py large.bin

Downloading: large.bin
Size: 1.00 MB
|████████████████████████---------------------------| 45.2% (0.45/1.00 MB)
```

**Terminal 3 - Client 2:**
```bash
$ python client.py medium.txt

Downloading: medium.txt
Size: 0.05 MB
|██████████████████████████████████████████████████| 100.0% (0.05/0.05 MB)
✓ File downloaded successfully: client_downloads/medium.txt
```

**Terminal 4 - Client 3:**
```bash
$ python client.py data.json

Downloading: data.json
Size: 0.00 MB
|██████████████████████████████████████████████████| 100.0% (0.00/0.00 MB)
✓ File downloaded successfully: client_downloads/data.json
```

**Terminal 1 - Server (showing concurrent handling):**
```bash
2026-01-15 10:35:10 - Thread-1 - INFO - New connection from ('127.0.0.1', 54322)
2026-01-15 10:35:10 - Thread-2 - INFO - New connection from ('127.0.0.1', 54323)
2026-01-15 10:35:10 - Thread-3 - INFO - New connection from ('127.0.0.1', 54324)
2026-01-15 10:35:10 - Thread-1 - INFO - Client requested file: large.bin
2026-01-15 10:35:10 - Thread-2 - INFO - Client requested file: medium.txt
2026-01-15 10:35:10 - Thread-3 - INFO - Client requested file: data.json
2026-01-15 10:35:10 - Thread-1 - INFO - Sending file 'large.bin' (1048576 bytes)
2026-01-15 10:35:10 - Thread-2 - INFO - Sending file 'medium.txt' (52428 bytes)
2026-01-15 10:35:10 - Thread-3 - INFO - Sending file 'data.json' (2048 bytes)
2026-01-15 10:35:10 - Thread-3 - INFO - File 'data.json' sent successfully
2026-01-15 10:35:11 - Thread-2 - INFO - File 'medium.txt' sent successfully
2026-01-15 10:35:12 - Thread-1 - INFO - File 'large.bin' sent successfully
```

---

## Example 3: Retry Logic with Exponential Backoff

### Scenario
Client attempts to connect before server is ready, demonstrating retry logic.

### Steps

**Terminal 1 - Client (server not running):**
```bash
$ python client.py document.txt

============================================================
File Transfer Client
Server: localhost:9999
Requesting: document.txt
Download directory: client_downloads
============================================================

2026-01-15 10:40:00 - INFO - Connection attempt 1/5 to localhost:9999
2026-01-15 10:40:00 - WARNING - Connection attempt 1 failed: [Errno 111] Connection refused
2026-01-15 10:40:00 - INFO - Retrying in 1 seconds...

2026-01-15 10:40:01 - INFO - Connection attempt 2/5 to localhost:9999
2026-01-15 10:40:01 - WARNING - Connection attempt 2 failed: [Errno 111] Connection refused
2026-01-15 10:40:01 - INFO - Retrying in 2 seconds...

2026-01-15 10:40:03 - INFO - Connection attempt 3/5 to localhost:9999
2026-01-15 10:40:03 - WARNING - Connection attempt 3 failed: [Errno 111] Connection refused
2026-01-15 10:40:03 - INFO - Retrying in 4 seconds...
```

**Terminal 2 - Start Server (during retry):**
```bash
$ python server.py

============================================================
File Transfer Server Started
Listening on: 0.0.0.0:9999
============================================================
```

**Terminal 1 - Client (continued):**
```bash
2026-01-15 10:40:07 - INFO - Connection attempt 4/5 to localhost:9999
2026-01-15 10:40:07 - INFO - Successfully connected to localhost:9999

Downloading: document.txt
Size: 0.05 MB
|██████████████████████████████████████████████████| 100.0% (0.05/0.05 MB)
✓ File downloaded successfully: client_downloads/document.txt
```

---

## Example 4: File Not Found Error

### Scenario
Client requests a file that doesn't exist on the server.

### Steps

**Terminal 1 - Server:**
```bash
$ python server.py

============================================================
File Transfer Server Started
============================================================
```

**Terminal 2 - Client:**
```bash
$ python client.py nonexistent.txt

============================================================
File Transfer Client
Server: localhost:9999
Requesting: nonexistent.txt
============================================================

2026-01-15 10:45:00 - INFO - Successfully connected to localhost:9999
2026-01-15 10:45:00 - INFO - Requested file: nonexistent.txt
2026-01-15 10:45:00 - ERROR - Server error: File 'nonexistent.txt' not found on server

Error: File 'nonexistent.txt' not found on server
```

**Terminal 1 - Server:**
```bash
2026-01-15 10:45:00 - Thread-1 - INFO - New connection from ('127.0.0.1', 54325)
2026-01-15 10:45:00 - Thread-1 - INFO - Client requested file: nonexistent.txt
2026-01-15 10:45:00 - Thread-1 - WARNING - File 'nonexistent.txt' not found
2026-01-15 10:45:00 - Thread-1 - INFO - Connection closed
```

---

## Example 5: Remote Server Transfer

### Scenario
Transfer file from a remote server on the network.

### Steps

**Server Machine (192.168.1.100):**
```bash
$ python server.py

============================================================
File Transfer Server Started
Listening on: 0.0.0.0:9999
============================================================
```

**Client Machine:**
```bash
$ python client.py report.pdf 192.168.1.100 9999

============================================================
File Transfer Client
Server: 192.168.1.100:9999
Requesting: report.pdf
============================================================

2026-01-15 10:50:00 - INFO - Connection attempt 1/5 to 192.168.1.100:9999
2026-01-15 10:50:00 - INFO - Successfully connected to 192.168.1.100:9999

Downloading: report.pdf
Size: 2.50 MB
|██████████████████████████████████████████████████| 100.0% (2.50/2.50 MB)
Verifying file integrity...
✓ File downloaded successfully: client_downloads/report.pdf
✓ Checksum verified: 9f8e7d6c5b4a...
```

---

## Example 6: Custom Port Configuration

### Scenario
Run server on custom port 8080.

### Steps

**Terminal 1 - Server:**
```bash
$ python server.py 8080

============================================================
File Transfer Server Started
Listening on: 0.0.0.0:8080
Files directory: server_files
Press Ctrl+C to stop
============================================================
```

**Terminal 2 - Client:**
```bash
$ python client.py data.json localhost 8080

============================================================
File Transfer Client
Server: localhost:8080
Requesting: data.json
============================================================

Downloading: data.json
Size: 0.00 MB
|██████████████████████████████████████████████████| 100.0% (0.00/0.00 MB)
✓ File downloaded successfully: client_downloads/data.json
```

---

## Example 7: Large File Transfer with Progress

### Scenario
Transfer a 10 MB file showing detailed progress.

### Steps

**Terminal 1 - Server:**
```bash
$ python server.py

2026-01-15 11:00:00 - Thread-1 - INFO - Sending file 'verylarge.bin' (10485760 bytes)
2026-01-15 11:00:00 - Thread-1 - INFO - Progress: 10% (1048576/10485760 bytes)
2026-01-15 11:00:01 - Thread-1 - INFO - Progress: 20% (2097152/10485760 bytes)
2026-01-15 11:00:01 - Thread-1 - INFO - Progress: 30% (3145728/10485760 bytes)
2026-01-15 11:00:02 - Thread-1 - INFO - Progress: 40% (4194304/10485760 bytes)
2026-01-15 11:00:02 - Thread-1 - INFO - Progress: 50% (5242880/10485760 bytes)
2026-01-15 11:00:03 - Thread-1 - INFO - Progress: 60% (6291456/10485760 bytes)
2026-01-15 11:00:03 - Thread-1 - INFO - Progress: 70% (7340032/10485760 bytes)
2026-01-15 11:00:04 - Thread-1 - INFO - Progress: 80% (8388608/10485760 bytes)
2026-01-15 11:00:04 - Thread-1 - INFO - Progress: 90% (9437184/10485760 bytes)
2026-01-15 11:00:05 - Thread-1 - INFO - File 'verylarge.bin' sent successfully
```

**Terminal 2 - Client:**
```bash
$ python client.py verylarge.bin

Downloading: verylarge.bin
Size: 10.00 MB
|██████████████████████████████████████████████████| 100.0% (10.00/10.00 MB)
Verifying file integrity...
✓ File downloaded successfully: client_downloads/verylarge.bin
✓ Checksum verified: 1a2b3c4d5e6f...
```

---

## Example 8: Graceful Shutdown

### Scenario
Stopping server gracefully during active transfers.

### Steps

**Terminal 1 - Server (with active transfer):**
```bash
$ python server.py

2026-01-15 11:05:00 - Thread-1 - INFO - Sending file 'large.bin' (1048576 bytes)
2026-01-15 11:05:00 - Thread-1 - INFO - Progress: 10% (104857/1048576 bytes)
2026-01-15 11:05:01 - Thread-1 - INFO - Progress: 20% (209715/1048576 bytes)

^C
Received shutdown signal. Stopping server...

2026-01-15 11:05:02 - MainThread - INFO - Shutting down server...
2026-01-15 11:05:02 - MainThread - INFO - Server shutdown complete
```

**Terminal 2 - Client:**
```bash
Downloading: large.bin
Size: 1.00 MB
|████████████----------------------------------| 25.0% (0.25/1.00 MB)

✗ Error: Connection lost during transfer
```

---

## Example 9: Automated Testing

### Scenario
Run the automated test suite.

### Steps

```bash
$ python run_tests.py

============================================================
FILE TRANSFER SYSTEM - TEST SUITE
============================================================

Cleaning up test environment...
✓ Cleanup complete

============================================================
Setting up test files...
============================================================
Creating test files...
✓ Created small.txt (< 1 KB)
✓ Created medium.txt (~50 KB)
✓ Created large.bin (1 MB)
✓ Created verylarge.bin (10 MB)
✓ Created data.json (~2 KB)

============================================================
Starting server...
============================================================
✓ Server started on port 9998

============================================================
Running download tests...
============================================================

Testing download: small.txt
----------------------------------------
✓ Successfully downloaded small.txt
  File size: 95 bytes

Testing download: medium.txt
----------------------------------------
✓ Successfully downloaded medium.txt
  File size: 52000 bytes

Testing download: large.bin
----------------------------------------
✓ Successfully downloaded large.bin
  File size: 1048576 bytes

Testing download: data.json
----------------------------------------
✓ Successfully downloaded data.json
  File size: 2048 bytes

Testing download: nonexistent.txt
----------------------------------------
✓ Expected failure for nonexistent.txt

============================================================
Testing concurrent downloads...
============================================================
✓ small.txt
✓ medium.txt
✓ data.json

✓ All concurrent downloads successful

============================================================
TEST SUMMARY
============================================================
✓ PASS: Small file
✓ PASS: Medium file
✓ PASS: Large binary
✓ PASS: JSON file
✓ PASS: Non-existent file
✓ PASS: Concurrent downloads

Results: 6/6 tests passed

🎉 All tests passed!

============================================================
Stopping server...
============================================================
✓ Server stopped
```

---

## Example 10: Checking Logs

### Scenario
Review logs after transfers.

### Steps

```bash
$ ls -la logs/
total 24
drwxr-xr-x 2 user user 4096 Jan 15 11:10 .
drwxr-xr-x 8 user user 4096 Jan 15 11:10 ..
-rw-r--r-- 1 user user 5432 Jan 15 11:10 server_20260115_110000.log
-rw-r--r-- 1 user user 3821 Jan 15 11:10 client_20260115_110005.log

$ cat logs/server_20260115_110000.log
2026-01-15 11:00:00 - MainThread - INFO - Server initialized on 0.0.0.0:9999
2026-01-15 11:00:00 - MainThread - INFO - Server listening on 0.0.0.0:9999
2026-01-15 11:00:05 - Thread-1 - INFO - New connection from ('127.0.0.1', 54326)
2026-01-15 11:00:05 - Thread-1 - INFO - Client requested file: document.txt
2026-01-15 11:00:05 - Thread-1 - INFO - Sending file 'document.txt' (52428 bytes)
2026-01-15 11:00:05 - Thread-1 - INFO - Progress: 10% (5242/52428 bytes)
2026-01-15 11:00:05 - Thread-1 - INFO - Progress: 20% (10485/52428 bytes)
...
2026-01-15 11:00:06 - Thread-1 - INFO - File 'document.txt' sent successfully
2026-01-15 11:00:06 - Thread-1 - INFO - Connection closed

$ cat logs/client_20260115_110005.log
2026-01-15 11:00:05 - INFO - Client initialized for localhost:9999
2026-01-15 11:00:05 - INFO - Connection attempt 1/5 to localhost:9999
2026-01-15 11:00:05 - INFO - Successfully connected to localhost:9999
2026-01-15 11:00:05 - INFO - Requested file: document.txt
2026-01-15 11:00:05 - INFO - Receiving: document.txt (52428 bytes)
2026-01-15 11:00:05 - INFO - Expected checksum: a1b2c3d4e5f6...
2026-01-15 11:00:06 - INFO - File integrity verified: a1b2c3d4e5f6...
2026-01-15 11:00:06 - INFO - Connection closed
```

---

These examples demonstrate all major features of the file transfer system in real-world scenarios!
