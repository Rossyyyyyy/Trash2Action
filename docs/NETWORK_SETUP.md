# Network Setup Guide - Trash2Action

## 🌐 How It Works

Your app now automatically detects and uses the correct network IP address! No more hardcoding IPs.

### Backend (Server)
- Automatically detects your computer's local network IP
- Binds to `0.0.0.0` to accept connections from any device on the network
- Shows the network URL when starting

### Frontend (Mobile App)
- Automatically uses the same IP as the Expo dev server
- Works seamlessly when both devices are on the same WiFi network

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd backend
node server.js
```

You'll see output like:
```
🚀 Server running on:
   Local:   http://localhost:5000
   Network: http://192.168.1.100:5000

📱 Test endpoints:
   http://192.168.1.100:5000/health
   http://192.168.1.100:5000/status

💡 Devices on the same network can connect using: http://192.168.1.100:5000
```

### 2. Start the Frontend App

```bash
cd frontend
npm start
```

The app will automatically connect to your backend using the network IP!

## 📱 Testing

### On the Same Device
- Open browser: `http://localhost:5000/health`
- Should return: `{"status":"ok",...}`

### On Mobile Device (Same WiFi)
- Make sure your phone and computer are on the SAME WiFi network
- Scan the QR code from Expo
- The app will automatically connect to the backend

### On Another Computer (Same WiFi)
- Open browser: `http://[YOUR_NETWORK_IP]:5000/health`
- Replace `[YOUR_NETWORK_IP]` with the IP shown in the backend console

## 🔧 Troubleshooting

### "Network Error" or "Could not connect"

1. **Check WiFi Connection**
   - Ensure both devices are on the SAME WiFi network
   - Not on mobile data or different networks

2. **Check Firewall**
   - Windows: Allow Node.js through Windows Firewall
   - Mac: System Preferences → Security & Privacy → Firewall → Allow Node

3. **Check Backend is Running**
   - Backend console should show "Server running on..."
   - Test: Open `http://localhost:5000/health` in browser

4. **Restart Both Services**
   ```bash
   # Stop backend (Ctrl+C), then restart
   cd backend
   node server.js
   
   # Stop frontend (Ctrl+C), then restart
   cd frontend
   npm start
   ```

### Custom IP Configuration (Optional)

If auto-detection doesn't work, you can manually set the IP:

**Backend (.env file):**
```env
BASE_URL=http://192.168.1.100:5000
```

**Frontend (app.json):**
```json
{
  "expo": {
    "extra": {
      "backendUrl": "http://192.168.1.100:5000"
    }
  }
}
```

## 🔒 Security Notes

- This setup is for DEVELOPMENT only
- For production, use:
  - HTTPS with proper SSL certificates
  - Environment-specific configuration
  - Secure API keys and secrets
  - Production-grade hosting (not localhost)

## 📝 How to Find Your Network IP

### Windows
```cmd
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter

### Mac/Linux
```bash
ifconfig
```
Look for "inet" under your WiFi interface (usually en0 or wlan0)

### The Easy Way
Just start the backend - it shows your network IP automatically! 🎉

## 🎯 What Changed

### Before (Hardcoded)
```javascript
const BASE_URL = "http://10.249.213.103:5000";  // ❌ Only works on one network
```

### After (Dynamic)
```javascript
import { API_URL } from './config';  // ✅ Works on any network
```

The system now:
- ✅ Auto-detects network IP
- ✅ Works on any WiFi network
- ✅ No manual IP configuration needed
- ✅ Easy to test on multiple devices
