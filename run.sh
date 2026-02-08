#!/bin/bash

# Naruto Action RPG - Launch Script
# Run this script to start the game

echo "🍥 Starting Naruto Action RPG..."
echo ""

# Check if port 8000 is already in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 8000 is already in use!"
    echo "Opening browser to existing server..."
    sleep 1
else
    echo "🌐 Starting local web server on port 8000..."
    echo ""

    # Start Python HTTP server in background
    python3 -m http.server 8000 &
    SERVER_PID=$!

    # Wait for server to start
    sleep 2

    echo "✅ Server started (PID: $SERVER_PID)"
    echo ""
fi

# Detect OS and open browser
echo "🎮 Opening game in browser..."
echo ""

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:8000 2>/dev/null || \
    sensible-browser http://localhost:8000 2>/dev/null || \
    firefox http://localhost:8000 2>/dev/null || \
    google-chrome http://localhost:8000 2>/dev/null
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:8000
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    start http://localhost:8000
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🍥 NARUTO ACTION RPG IS NOW RUNNING!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐 Game URL: http://localhost:8000"
echo "  📱 Mobile:   http://YOUR_IP:8000"
echo ""
echo "  Controls:"
echo "  • Desktop: Click to move, Q/W/E/R for abilities"
echo "  • Mobile:  Tap to move, joystick + ability buttons"
echo ""
echo "  Press Ctrl+C to stop the server"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Keep script running and handle cleanup
if [ ! -z "$SERVER_PID" ]; then
    # Trap Ctrl+C to kill server gracefully
    trap "echo ''; echo '🛑 Stopping server...'; kill $SERVER_PID 2>/dev/null; echo '✅ Server stopped. Thanks for playing!'; exit 0" INT TERM

    # Wait for server process
    wait $SERVER_PID
fi
