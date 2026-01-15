#!/bin/bash
# Helper commands for Unix/Linux/Mac - File Transfer System

show_help() {
    echo ""
    echo "File Transfer System - Helper Commands"
    echo "======================================"
    echo ""
    echo "Usage: ./commands.sh [command] [args]"
    echo ""
    echo "Commands:"
    echo "  setup          - Create test files"
    echo "  server [port]  - Start server (default port: 9999)"
    echo "  client [file] [host] [port] - Download file"
    echo "  test           - Run automated tests"
    echo "  clean          - Clean up downloads and logs"
    echo "  help           - Show this help"
    echo ""
    echo "Examples:"
    echo "  ./commands.sh setup"
    echo "  ./commands.sh server"
    echo "  ./commands.sh server 8080"
    echo "  ./commands.sh client small.txt"
    echo "  ./commands.sh client file.txt 192.168.1.100 9999"
    echo "  ./commands.sh test"
    echo "  ./commands.sh clean"
    echo ""
}

setup_files() {
    echo "Creating test files..."
    python3 test_setup.py
}

start_server() {
    if [ -z "$1" ]; then
        echo "Starting server on default port 9999..."
        python3 server.py
    else
        echo "Starting server on port $1..."
        python3 server.py "$1"
    fi
}

download_file() {
    if [ -z "$1" ]; then
        echo "Error: Filename required"
        echo "Usage: ./commands.sh client [filename] [host] [port]"
        return 1
    fi
    
    if [ -z "$2" ]; then
        echo "Downloading $1 from localhost:9999..."
        python3 client.py "$1"
    elif [ -z "$3" ]; then
        echo "Downloading $1 from $2:9999..."
        python3 client.py "$1" "$2"
    else
        echo "Downloading $1 from $2:$3..."
        python3 client.py "$1" "$2" "$3"
    fi
}

run_tests() {
    echo "Running automated tests..."
    python3 run_tests.py
}

clean_up() {
    echo "Cleaning up..."
    rm -rf client_downloads/
    rm -rf logs/
    rm -f server_files/*.txt server_files/*.bin server_files/*.json
    echo "Cleanup complete!"
}

# Main command dispatcher
case "$1" in
    setup)
        setup_files
        ;;
    server)
        start_server "$2"
        ;;
    client)
        download_file "$2" "$3" "$4"
        ;;
    test)
        run_tests
        ;;
    clean)
        clean_up
        ;;
    help|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
