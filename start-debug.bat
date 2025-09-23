@echo off
echo Starting QR Attendance System for ngrok debugging...
echo.

echo Step 1: Starting Backend Server (Network accessible)...
start "Backend Server" cmd /k "cd /d backend && echo Backend starting on http://192.168.0.151:5000 && npm start"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Step 2: Starting Frontend Server...  
start "Frontend Server" cmd /k "cd /d frontend && echo Frontend starting on http://localhost:3000 && npm start"

echo Waiting for frontend to start...
timeout /t 8 /nobreak >nul

echo Step 3: Testing backend connectivity...
echo Testing backend at http://192.168.0.151:5000/health
curl -s http://192.168.0.151:5000/health
echo.
echo.

echo =======================================================
echo   🚀 SERVERS STARTED - Ready for ngrok tunnel
echo =======================================================
echo.
echo LOCAL ACCESS:
echo   Frontend: http://localhost:3000
echo   Backend:  http://192.168.0.151:5000/api
echo.
echo NEXT STEPS:
echo 1. Verify backend is accessible at: http://192.168.0.151:5000/health
echo 2. Run ngrok in another terminal: ngrok http 3000  
echo 3. Use the ngrok HTTPS URL on mobile device
echo.
echo The frontend will automatically detect ngrok and use the correct backend URL!
echo.
pause