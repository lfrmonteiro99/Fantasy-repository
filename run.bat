@echo off
REM Naruto Action RPG - Windows Launch Script

echo.
echo ============================================
echo   NARUTO ACTION RPG - STARTING...
echo ============================================
echo.

REM Start Python HTTP server
echo Starting local web server on port 8000...
start /B python -m http.server 8000

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Open browser
echo Opening game in browser...
start http://localhost:8000

echo.
echo ============================================
echo   GAME IS NOW RUNNING!
echo ============================================
echo.
echo   Game URL: http://localhost:8000
echo.
echo   Controls:
echo   - Click to move
echo   - Q/W/E/R for abilities
echo   - ESC to pause
echo.
echo   Press Ctrl+C to stop the server
echo.
echo ============================================
echo.

pause
