#!/bin/bash

# Script to connect to a remote server using SSH with private key authentication
# Usage: ./script.sh <username> <host>

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# SSH key file
SSH_KEY="school"

# Function to display usage
usage() {
    echo -e "${YELLOW}Usage: $0 <username> <host>${NC}"
    echo "Example: $0 ubuntu 192.168.1.100"
    exit 1
}

# Function to display error messages
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Check if correct number of arguments provided
if [ $# -ne 2 ]; then
    echo -e "${RED}Error: Invalid number of arguments${NC}"
    usage
fi

# Assign arguments to variables
USERNAME="$1"
HOST="$2"

# Validate username is not empty
if [ -z "$USERNAME" ]; then
    error_exit "Username cannot be empty"
fi

# Validate host is not empty
if [ -z "$HOST" ]; then
    error_exit "Host cannot be empty"
fi

# Check if SSH key file exists
if [ ! -f "$SSH_KEY" ]; then
    error_exit "SSH key file '$SSH_KEY' not found in current directory"
fi

# Check if SSH key has correct permissions (should be 600 or 400)
KEY_PERMS=$(stat -c "%a" "$SSH_KEY" 2>/dev/null || stat -f "%OLp" "$SSH_KEY" 2>/dev/null)
if [ "$KEY_PERMS" != "600" ] && [ "$KEY_PERMS" != "400" ]; then
    echo -e "${YELLOW}Warning: SSH key has permissions $KEY_PERMS. Recommended: 600${NC}"
    echo "Attempting to fix permissions..."
    chmod 600 "$SSH_KEY" || error_exit "Failed to set correct permissions on SSH key"
    echo -e "${GREEN}Permissions corrected to 600${NC}"
fi

# Display connection information
echo -e "${GREEN}Connecting to remote server...${NC}"
echo "Username: $USERNAME"
echo "Host: $HOST"
echo "SSH Key: $SSH_KEY"
echo "---"

# Attempt SSH connection
# Options:
#   -i: specifies the identity file (private key)
#   -o StrictHostKeyChecking=no: disables strict host key checking for non-interactive use
#   -o BatchMode=yes: prevents password prompts (non-interactive)
#   -o ConnectTimeout=10: sets connection timeout to 10 seconds
ssh -i "$SSH_KEY" \
    -o StrictHostKeyChecking=no \
    -o BatchMode=yes \
    -o ConnectTimeout=10 \
    "${USERNAME}@${HOST}"

# Check SSH exit status
SSH_EXIT_CODE=$?

if [ $SSH_EXIT_CODE -ne 0 ]; then
    case $SSH_EXIT_CODE in
        255)
            error_exit "SSH connection failed (exit code 255). Check network connectivity, host, and credentials."
            ;;
        *)
            error_exit "SSH connection failed with exit code $SSH_EXIT_CODE"
            ;;
    esac
fi

echo -e "${GREEN}Connection closed successfully${NC}"
exit 0
