@echo off
echo Starting QR Attendance System with ngrok HTTPS...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d backend && npm start"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d frontend && npm start"

echo Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo Starting ngrok tunnel for HTTPS access...
echo This will create a secure HTTPS tunnel to your local server.
echo.
echo IMPORTANT: Copy the ngrok HTTPS URL and test it on your mobile device!
echo.
pause

"C:\Users\trivi\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" http 3000
