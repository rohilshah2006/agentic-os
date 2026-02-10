#!/bin/bash

# 1. Kill any old servers running on these ports (Cleanup)
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "🚀 Starting Agentic OS..."

# 2. Start the Brain (Python) in the background
source venv/bin/activate
python3 server.py &
SERVER_PID=$!
echo "🧠 Brain active (PID: $SERVER_PID)"

# 3. Start the Face (React)
cd dashboard
npm run dev &
DASHBOARD_PID=$!
echo "🎨 Face active (PID: $DASHBOARD_PID)"

# 4. Open the Browser automatically
sleep 2
open "http://localhost:5173"

# 5. Handle Exit (Ctrl+C kills both)
trap "kill $SERVER_PID $DASHBOARD_PID; exit" SIGINT
wait