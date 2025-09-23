@echo off
echo Testing network connectivity for mobile access...
echo.

echo Current IP configuration:
ipconfig | findstr IPv4
echo.

echo Testing if backend port 5000 is accessible...
netstat -an | findstr :5000
echo.

echo Testing backend health endpoint...
echo GET http://192.168.0.151:5000/health
curl -s -w "Response code: %%{http_code}\n" http://192.168.0.151:5000/health
echo.

echo Testing if Windows Firewall is blocking...
netsh advfirewall firewall show rule name="Node.js Server" 2>nul || echo No Node.js firewall rule found

echo.
echo =================================
echo Network Test Complete
echo =================================
echo.
echo If backend is running and you see response code 200 above,
echo your mobile device should be able to connect via ngrok.
echo.
pause