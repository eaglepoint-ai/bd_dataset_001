# Quick Start Guide

Get up and running with the file transfer system in 3 minutes.

## Step 1: Create Test Files

```bash
python test_setup.py
```

This creates sample files in `server_files/`:
- `small.txt` - Small text file
- `medium.txt` - Medium text file (~50 KB)
- `large.bin` - Large binary file (1 MB)
- `verylarge.bin` - Very large file (10 MB)
- `data.json` - JSON data file

## Step 2: Start the Server

Open a terminal and run:

```bash
python server.py
```

You should see:
```
============================================================
File Transfer Server Started
Listening on: 0.0.0.0:9999
Files directory: server_files
Press Ctrl+C to stop
============================================================
```

## Step 3: Download a File

Open another terminal and run:

```bash
python client.py small.txt
```

You should see:
```
============================================================
File Transfer Client
Server: localhost:9999
Requesting: small.txt
Download directory: client_downloads
============================================================

Downloading: small.txt
Size: 0.00 MB
|██████████████████████████████████████████████████| 100.0% (0.00/0.00 MB)
Verifying file integrity...
✓ File downloaded successfully: client_downloads/small.txt
✓ Checksum verified: [checksum]
```

## Step 4: Test Multiple Concurrent Downloads

In separate terminals, run:

```bash
# Terminal 1
python client.py medium.txt

# Terminal 2
python client.py large.bin

# Terminal 3
python client.py data.json
```

Watch the server terminal to see it handling multiple clients simultaneously!

## Step 5: Test Retry Logic

1. Stop the server (Ctrl+C)
2. Start a client: `python client.py small.txt`
3. Watch it retry with exponential backoff
4. Start the server within 63 seconds
5. Watch the client connect and download successfully

## Step 6: Check the Logs

```bash
# View server logs
ls -la logs/server_*.log

# View client logs
ls -la logs/client_*.log

# Read the latest server log
cat logs/server_*.log | tail -20

# Read the latest client log
cat logs/client_*.log | tail -20
```

## Common Commands

### Server

```bash
# Default port (9999)
python server.py

# Custom port
python server.py 8080
```

### Client

```bash
# Download from localhost:9999
python client.py filename.txt

# Download from specific host
python client.py filename.txt 192.168.1.100

# Download from specific host and port
python client.py filename.txt 192.168.1.100 8080
```

## Troubleshooting

### "Connection refused"
- Make sure the server is running
- Check the port number matches
- Verify firewall settings

### "File not found"
- Ensure the file exists in `server_files/` directory
- Check the filename spelling

### "Checksum verification failed"
- Transfer was corrupted
- Try downloading again
- Check network stability

### Port already in use
- Another process is using the port
- Use a different port: `python server.py 8080`
- Or stop the other process

## Next Steps

- Add your own files to `server_files/`
- Test with larger files
- Try downloading from different machines on your network
- Review the logs to understand the protocol
- Modify the code to add new features

Enjoy your robust file transfer system! 🚀
