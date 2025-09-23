# 📱 Complete ngrok Setup for Mobile Camera Access

## The Problem
When using ngrok HTTPS for the frontend, browsers block HTTP requests to the backend (mixed content security policy). 

## 🚀 Solution: Run Both Frontend and Backend through ngrok

### Step 1: Start Both Servers
```bash
# Terminal 1 - Start backend
cd backend
npm start

# Terminal 2 - Start frontend  
cd frontend
npm start
```

Wait for both servers to fully start.

### Step 2: Create ngrok Tunnels (Need 2 terminals)

**Terminal 3 - Frontend ngrok:**
```bash
ngrok http 3000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Terminal 4 - Backend ngrok:**
```bash
ngrok http 5000
```
Copy the HTTPS URL (e.g., `https://def456.ngrok.io`)

### Step 3: Update Frontend Config
Update `frontend/.env` with the backend ngrok URL:
```
REACT_APP_API_URL=https://def456.ngrok.io/api
```

### Step 4: Restart Frontend
Restart the frontend server to pick up the new environment variable:
```bash
# In Terminal 2
Ctrl+C (stop frontend)
npm start (restart frontend)
```

### Step 5: Test on Mobile
- Use the **frontend ngrok URL** on your mobile device: `https://abc123.ngrok.io`
- Camera access should work perfectly!
- Login should work without "failed to fetch" errors

## 🎯 Quick Commands Summary

1. `start-debug.bat` (starts both servers)
2. `ngrok http 3000` (frontend tunnel)
3. `ngrok http 5000` (backend tunnel)  
4. Update `.env` with backend ngrok URL
5. Restart frontend server

## 🔧 Alternative: Use Network Test

If you're still getting errors:
1. Go to "Network Test" in the student dashboard
2. Click "Run All Tests" 
3. This will show exactly what's failing (CORS, connectivity, etc.)

## 📋 URLs Summary

- **Local Development**: `http://localhost:3000` → `http://localhost:5000/api`
- **Mobile Access**: `https://frontend.ngrok.io` → `https://backend.ngrok.io/api`

This ensures both frontend and backend use HTTPS, eliminating mixed content issues!