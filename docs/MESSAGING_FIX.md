# Messaging Error Fix

## Error
```
ERROR Load messages error: [SyntaxError: JSON Parse error: Unexpected character: <]
```

## Cause
This error occurs when the API endpoint returns HTML instead of JSON, which typically means:
1. The endpoint doesn't exist (404 error returns HTML)
2. The server hasn't been restarted with the new endpoints
3. Socket.IO dependencies aren't installed

## Solution

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Restart Backend Server

1. Stop the current backend server (Ctrl+C or Cmd+C)
2. Start it again:
```bash
cd backend
npm start
```

You should see:
```
✅ MongoDB connected
🚀 Server running on:
   Local:   http://localhost:5000
   Network: http://192.168.x.x:5000
🔌 Socket.IO ready for real-time messaging
```

### Step 3: Restart Frontend

1. Stop the frontend (Ctrl+C or Cmd+C)
2. Start it again:
```bash
cd frontend
npm start
```

### Step 4: Test the Messaging

1. Open the app on your device/simulator
2. Login with a user account
3. Go to Profile or Newsfeed
4. Click on another user's name
5. Try sending a message

### Verification

Check the console logs:
- Frontend should show: `📨 Loading messages from: http://192.168.x.x:5000/api/messages/[userId]`
- Backend should show: `✅ User [userId] joined room: user_[userId]`

### Still Having Issues?

1. **Check API_URL:**
   - Open `frontend/config.js`
   - Verify the API_URL is correct
   - Should be: `http://[YOUR_IP]:5000` (without `/api` at the end)

2. **Check Backend Logs:**
   - Look for any errors when the server starts
   - Verify the message endpoints are registered

3. **Check Network:**
   - Both devices must be on the same WiFi network
   - Firewall should allow connections on port 5000

4. **Test Endpoint Manually:**
   - Open browser: `http://[YOUR_IP]:5000/health`
   - Should return JSON: `{"status":"ok",...}`

5. **Clear Cache:**
   ```bash
   # Frontend
   cd frontend
   npm start -- --clear
   
   # Or
   expo start -c
   ```

### Debug Mode

Add this to see detailed logs:

**In UserProfile.js or UserNF.js:**
```javascript
const loadMessages = async (userId) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    console.log("🔑 Token:", token ? "exists" : "missing");
    console.log("📨 Loading from:", `${API_URL}/api/messages/${userId}`);
    
    const response = await fetch(`${API_URL}/api/messages/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("📡 Response status:", response.status);
    console.log("📡 Response headers:", response.headers);
    
    // ... rest of code
  } catch (error) {
    console.error("❌ Error details:", error);
  }
};
```

## Expected Behavior After Fix

1. ✅ Messages load without errors
2. ✅ Can send messages in real-time
3. ✅ Typing indicators work
4. ✅ Messages persist in database
5. ✅ Socket.IO connects successfully

## Common Mistakes

❌ **Wrong:** `http://192.168.1.100:5000/api` (API_URL with /api)
✅ **Correct:** `http://192.168.1.100:5000` (API_URL without /api)

❌ **Wrong:** Not restarting backend after adding new endpoints
✅ **Correct:** Always restart backend when adding new routes

❌ **Wrong:** Using different WiFi networks
✅ **Correct:** Same network for both devices

## Need More Help?

Check these files:
- `docs/REALTIME_MESSAGING_SETUP.md` - Full setup guide
- `docs/TROUBLESHOOTING.md` - General troubleshooting
- Backend console - Look for error messages
- Frontend console - Check API_URL and request logs
