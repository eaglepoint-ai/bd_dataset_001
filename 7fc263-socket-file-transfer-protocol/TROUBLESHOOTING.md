# Troubleshooting Guide

Common issues and their solutions for the file transfer system.

## Connection Issues

### Problem: "Connection refused"

**Symptoms:**
```
Connection attempt 1/5 to localhost:9999
Error: [Errno 111] Connection refused
```

**Causes & Solutions:**

1. **Server not running**
   ```bash
   # Check if server is running
   netstat -tuln | grep 9999
   
   # Start the server
   python server.py
   ```

2. **Wrong port number**
   ```bash
   # Check server port in logs
   cat logs/server_*.log | grep "listening"
   
   # Use correct port
   python client.py file.txt localhost 9999
   ```

3. **Firewall blocking connection**
   ```bash
   # Windows: Allow Python through firewall
   # Linux: Check iptables
   sudo iptables -L | grep 9999
   
   # Allow port
   sudo ufw allow 9999
   ```

### Problem: "Connection timeout"

**Symptoms:**
```
Connection attempt 1/5 to 192.168.1.100:9999
Socket timeout after 10 seconds
```

**Causes & Solutions:**

1. **Network unreachable**
   ```bash
   # Test connectivity
   ping 192.168.1.100
   
   # Test port
   telnet 192.168.1.100 9999
   ```

2. **Server overloaded**
   - Wait and retry
   - Check server logs for errors
   - Restart server if needed

3. **Network latency**
   - Increase timeout in client.py:
   ```python
   self.socket.settimeout(30)  # Increase from 10 to 30
   ```

## File Transfer Issues

### Problem: "File not found"

**Symptoms:**
```
Server error: File 'myfile.txt' not found on server
```

**Solutions:**

1. **Check file exists**
   ```bash
   ls -la server_files/
   ```

2. **Check filename spelling**
   - Filenames are case-sensitive
   - Check for extra spaces

3. **Place file in correct directory**
   ```bash
   cp /path/to/file.txt server_files/
   ```

### Problem: "Checksum verification failed"

**Symptoms:**
```
✗ Checksum verification failed!
  Expected: abc123...
  Got:      def456...
```

**Causes & Solutions:**

1. **Network corruption**
   - Retry the download
   - Check network stability
   ```bash
   # Test network quality
   ping -c 100 server_ip
   ```

2. **File modified during transfer**
   - Ensure file isn't being written to
   - Stop any processes modifying the file

3. **Disk error**
   - Check disk health
   ```bash
   # Linux
   df -h
   
   # Windows
   chkdsk
   ```

### Problem: "Transfer interrupted"

**Symptoms:**
```
Transfer interrupted by shutdown signal
```

**Solutions:**

1. **Don't press Ctrl+C during transfer**
   - Wait for transfer to complete
   - Use background process if needed

2. **Resume not supported**
   - Currently, you must restart the download
   - Future enhancement: resume support

## Performance Issues

### Problem: "Slow transfer speed"

**Symptoms:**
- Transfer takes much longer than expected
- Progress bar moves slowly

**Solutions:**

1. **Increase buffer size**
   ```python
   # In both server.py and client.py
   BUFFER_SIZE = 8192  # Increase from 4096
   ```

2. **Check network bandwidth**
   ```bash
   # Test network speed
   iperf3 -c server_ip
   ```

3. **Reduce concurrent transfers**
   - Limit number of simultaneous clients
   - Transfer files sequentially

### Problem: "High CPU usage"

**Symptoms:**
- Server using 100% CPU
- System becomes slow

**Solutions:**

1. **Limit concurrent clients**
   ```python
   # In server.py, modify listen queue
   self.server_socket.listen(3)  # Reduce from 5
   ```

2. **Add rate limiting**
   ```python
   # In server.py, add delay between chunks
   time.sleep(0.001)  # 1ms delay
   ```

## Server Issues

### Problem: "Address already in use"

**Symptoms:**
```
OSError: [Errno 98] Address already in use
```

**Solutions:**

1. **Kill existing server**
   ```bash
   # Find process
   lsof -i :9999
   
   # Kill process
   kill -9 <PID>
   ```

2. **Use different port**
   ```bash
   python server.py 9998
   ```

3. **Wait for socket to close**
   - Wait 30-60 seconds
   - OS will release the port

### Problem: "Too many open files"

**Symptoms:**
```
OSError: [Errno 24] Too many open files
```

**Solutions:**

1. **Increase file descriptor limit**
   ```bash
   # Linux
   ulimit -n 4096
   
   # Permanent change in /etc/security/limits.conf
   * soft nofile 4096
   * hard nofile 8192
   ```

2. **Ensure connections are closed**
   - Check server logs
   - Restart server to clear connections

## Client Issues

### Problem: "Permission denied writing file"

**Symptoms:**
```
PermissionError: [Errno 13] Permission denied: 'client_downloads/file.txt'
```

**Solutions:**

1. **Check directory permissions**
   ```bash
   ls -la client_downloads/
   chmod 755 client_downloads/
   ```

2. **File already open**
   - Close any programs using the file
   - Delete existing file if needed

3. **Run with appropriate permissions**
   ```bash
   # Linux/Mac
   sudo python client.py file.txt
   ```

### Problem: "Disk full"

**Symptoms:**
```
OSError: [Errno 28] No space left on device
```

**Solutions:**

1. **Free up disk space**
   ```bash
   # Check disk usage
   df -h
   
   # Clean up old downloads
   rm -rf client_downloads/*
   ```

2. **Download to different location**
   - Modify CLIENT_DOWNLOAD_DIR in client.py
   - Point to drive with more space

## Logging Issues

### Problem: "No log files created"

**Symptoms:**
- `logs/` directory empty
- No log output

**Solutions:**

1. **Check directory permissions**
   ```bash
   mkdir -p logs
   chmod 755 logs
   ```

2. **Check disk space**
   ```bash
   df -h
   ```

3. **Verify logging configuration**
   - Check _setup_logging() method
   - Ensure no exceptions during setup

### Problem: "Log files too large"

**Symptoms:**
- Log files consuming too much disk space

**Solutions:**

1. **Implement log rotation**
   ```python
   from logging.handlers import RotatingFileHandler
   
   handler = RotatingFileHandler(
       log_filename,
       maxBytes=10*1024*1024,  # 10 MB
       backupCount=5
   )
   ```

2. **Clean old logs**
   ```bash
   # Delete logs older than 7 days
   find logs/ -name "*.log" -mtime +7 -delete
   ```

## Testing Issues

### Problem: "Tests fail randomly"

**Symptoms:**
- Tests pass sometimes, fail other times
- Inconsistent results

**Solutions:**

1. **Increase timeouts**
   ```python
   # In run_tests.py
   proc.wait(timeout=60)  # Increase from 30
   ```

2. **Add delays between tests**
   ```python
   time.sleep(2)  # Wait between tests
   ```

3. **Check system resources**
   ```bash
   # Monitor during tests
   top
   htop
   ```

## Platform-Specific Issues

### Windows

**Problem: "WinError 10048"**
```
OSError: [WinError 10048] Only one usage of each socket address
```

**Solution:**
- Wait 2 minutes for socket to close
- Or restart computer

**Problem: "Firewall blocking"**
- Allow Python in Windows Defender Firewall
- Add exception for the port

### Linux

**Problem: "Permission denied on port < 1024"**
```
PermissionError: [Errno 13] Permission denied
```

**Solution:**
```bash
# Use port >= 1024, or run as root
sudo python server.py 80
```

### macOS

**Problem: "Connection reset by peer"**
- Check macOS firewall settings
- Allow incoming connections for Python

## Debug Mode

Enable detailed debugging:

### Server Debug Mode
```python
# In server.py, change logging level
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO
    ...
)
```

### Client Debug Mode
```python
# In client.py, add socket debugging
import socket
socket.setdefaulttimeout(None)  # Disable timeout for debugging
```

### Network Debugging
```bash
# Capture network traffic
tcpdump -i any port 9999 -w capture.pcap

# Analyze with Wireshark
wireshark capture.pcap
```

## Getting Help

If you're still stuck:

1. **Check the logs**
   ```bash
   tail -f logs/server_*.log
   tail -f logs/client_*.log
   ```

2. **Enable debug logging**
   - Set logging level to DEBUG
   - Review detailed output

3. **Test with minimal setup**
   ```bash
   # Test with small file
   echo "test" > server_files/test.txt
   python client.py test.txt
   ```

4. **Verify system requirements**
   - Python 3.6+
   - Network connectivity
   - Sufficient disk space
   - Proper permissions

5. **Check GitHub issues**
   - Search for similar problems
   - Create new issue with logs

## Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| ECONNREFUSED (111) | Connection refused | Start server |
| ETIMEDOUT (110) | Connection timeout | Check network |
| EADDRINUSE (98) | Address in use | Kill existing process |
| EPERM (1) | Permission denied | Check permissions |
| ENOENT (2) | File not found | Check file path |
| ENOSPC (28) | No space left | Free disk space |
| EMFILE (24) | Too many open files | Increase limit |

## Prevention Tips

1. **Always check logs first**
2. **Test with small files before large ones**
3. **Monitor system resources**
4. **Keep backups of important files**
5. **Use version control for code changes**
6. **Document any configuration changes**
7. **Test in isolated environment first**

## Emergency Recovery

If everything fails:

```bash
# 1. Stop all processes
pkill -f "python.*server.py"
pkill -f "python.*client.py"

# 2. Clean up
rm -rf client_downloads/*
rm -rf logs/*

# 3. Reset test environment
python test_setup.py

# 4. Start fresh
python server.py &
sleep 2
python client.py small.txt

# 5. Check if working
ls -la client_downloads/
```

Still having issues? Check the logs and review the ARCHITECTURE.md for system details.
