# 📱 ngrok Setup for Mobile Camera Access

## Why ngrok?
- ✅ **Real HTTPS**: Provides genuine HTTPS certificates trusted by all browsers
- ✅ **No Configuration**: Works immediately without certificate setup
- ✅ **Public Access**: Can be accessed from anywhere (useful for demos)
- ✅ **Mobile Camera**: Fully supports camera access on mobile devices

## Quick Start 🚀

### Method 1: Use the Batch File (Recommended)
```bash
start-with-ngrok.bat
```

This will automatically:
1. Start the backend server (port 5000)
2. Start the frontend server (port 3000) 
3. Launch ngrok tunnel

### Method 2: Manual Steps

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd frontend  
   npm start
   ```

3. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

## How to Use 📲

1. **Run the batch file** and wait for all services to start

2. **Copy the ngrok URL** - Look for something like:
   ```
   https://abc123.ngrok.io -> http://localhost:3000
   ```

3. **Open on mobile** - Use the `https://abc123.ngrok.io` URL on your mobile device

4. **Test camera access** - Go to "Camera Test" or "Scan QR" and verify camera works

## URLs Summary 📋

- **Local Development**: `http://localhost:3000`
- **Mobile Access**: `https://YOUR-NGROK-URL.ngrok.io` 
- **Backend API**: `http://localhost:5000/api`

## Troubleshooting 🔧

### ngrok Session Limits
- **Free Plan**: Session expires after ~2 hours
- **Solution**: Restart ngrok when needed
- **Alternative**: Sign up for ngrok account for longer sessions

### Network Issues
- Ensure both backend and frontend are running first
- Wait for React dev server to fully start before running ngrok
- If URL changes, you may need to update API configuration

### Camera Still Not Working?
1. Verify you're using the HTTPS ngrok URL (not localhost)
2. Check browser permissions for camera access
3. Use the "Camera Test" component to diagnose issues
4. Try different browsers (Chrome mobile works best)

## Optional: ngrok Account Setup
For better stability and custom subdomains:

1. Sign up at: https://ngrok.com/
2. Get your auth token
3. Run: `ngrok authtoken YOUR_TOKEN`
4. Enjoy longer sessions and custom URLs

## Security Note 🔐
ngrok tunnels are public by default. Don't share the URL if your app contains sensitive data. For production, use proper SSL certificates.