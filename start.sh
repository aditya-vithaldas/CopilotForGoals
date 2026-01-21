#!/bin/bash

# Start script for CoworkForEnterprise
# Runs both frontend and backend concurrently

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting CoworkForEnterprise...${NC}"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${GREEN}Starting backend...${NC}"
(cd "$SCRIPT_DIR/backend" && npm run dev) &
BACKEND_PID=$!

# Give backend a moment to start
sleep 1

# Start frontend
echo -e "${GREEN}Starting frontend...${NC}"
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo -e "${GREEN}Both services started!${NC}"
echo -e "  Backend PID: $BACKEND_PID"
echo -e "  Frontend PID: $FRONTEND_PID"
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
