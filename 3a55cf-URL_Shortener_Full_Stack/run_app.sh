#!/bin/sh

echo "=== Starting URL Shortener Application ==="

cd /workspace/repository_after/server
npm install --silent

cd /workspace/repository_after/client
npm install --silent

cd /workspace/repository_after/server
node src/index.js &
SERVER_PID=$!

cd /workspace/repository_after/client
npm run dev -- --host 0.0.0.0 &
CLIENT_PID=$!

echo ""
echo "Server: http://localhost:3001"
echo "Client: http://localhost:5173"

wait $SERVER_PID $CLIENT_PID
