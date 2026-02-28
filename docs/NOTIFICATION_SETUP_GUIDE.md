# Real-Time Notification Setup Guide

## Quick Start

### 1. Restart Backend Server

The notification endpoints have been added to `backend/server.js`. You need to restart the server:

```bash
cd backend
node server.js
```

Or if using nodemon:
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

### 2. Verify Backend is Running

Test the notification endpoint:
```bash
cd backend
node test-notifications.js
```

Or manually test with curl:
```bash
curl "http://localhost:5000/api/notifications?userId=507f1f77bcf86cd799439011&userType=responder"
```

Expected response:
```json
{
  "success": true,
  "notifications": [],
  "unreadCount": 0
}
```

### 3. Test in the App

1. **Login as Admin**
   - Open the app
   - Go to Responder Login
   - Login with admin credentials

2. **Check Console Logs**
   - Look for: `"Fetching notifications from: http://..."`
   - Should see: `"✅ Socket connected"`
   - Should see: `"✅ User [id] joined room: user_[id]"`

3. **Test Real-Time Notifications**
   - In another device/browser, login as a regular user
   - Create a new post in the newsfeed
   - Admin should receive notification instantly
   - Badge count should update automatically

## Troubleshooting

### Error: "JSON Parse error: Unexpected character: <"

This means the server is returning HTML instead of JSON. Common causes:

1. **Backend not running**
   - Solution: Start the backend server

2. **Wrong API URL**
   - Check `frontend/config.js`
   - Verify `API_URL` matches your backend address
   - Example: `http://192.168.1.100:5000`

3. **Endpoint doesn't exist**
   - Solution: Restart backend server to load new endpoints

4. **CORS issue**
   - Backend already has CORS enabled
   - Check if backend logs show the request

### Error: "No responder ID available"

This means the responder object is not properly passed:

1. Check login flow
2. Verify token is valid
3. Check navigation params: `{ token, responder }`

### Socket.IO Not Connecting

1. **Check backend logs**
   - Should see: `"👤 User connected: [socket-id]"`
   - Should see: `"✅ User [id] joined room: user_[id]"`

2. **Check frontend logs**
   - Should see: `"🔌 Connecting to Socket.IO at: http://..."`
   - Should see: `"✅ Socket connected: [socket-id]"`

3. **Network issues**
   - Ensure devices are on same network
   - Check firewall settings
   - Try using IP address instead of localhost

### Notifications Not Appearing

1. **Check database**
   - Open MongoDB Compass
   - Check `notifications` collection
   - Verify documents exist

2. **Check Socket.IO listener**
   - Look for: `"📬 New notification received:"`
   - If not appearing, socket listener may not be active

3. **Force refresh**
   - Pull down to refresh on notification screen
   - Should fetch latest notifications from API

## Testing Checklist

- [ ] Backend server is running
- [ ] MongoDB is connected
- [ ] Socket.IO is initialized
- [ ] Admin can login successfully
- [ ] Notification screen loads without errors
- [ ] Badge shows correct unread count
- [ ] Creating a post triggers notification
- [ ] Notification appears in real-time
- [ ] Badge count updates automatically
- [ ] Clicking notification navigates correctly
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Delete notification works

## Next Steps

Once basic notifications are working:

1. **Add Report Notifications**
   - Implement report submission endpoint
   - Add notification creation code
   - Test with real report data

2. **Add Comment Notifications**
   - Emit notification when comment is added
   - Show in notification list

3. **Add Push Notifications**
   - Install Expo Notifications
   - Configure push tokens
   - Send push notifications for important events

4. **Add Notification Preferences**
   - Let admins choose which notifications to receive
   - Add settings screen

## Code Changes Summary

### Backend (`backend/server.js`)
- ✅ Added Notification schema
- ✅ Added notification endpoints (GET, PUT, DELETE)
- ✅ Added Socket.IO event for new notifications
- ✅ Emit notifications when posts are created
- ✅ Emit notifications when admin requests are made

### Frontend
- ✅ Updated `socket.js` with notification listeners
- ✅ Updated `AdminNotif.js` with real-time functionality
- ✅ Updated `AdminDashboard.js` with badge count
- ✅ Added error handling for API calls
- ✅ Added loading states

## Support

If you encounter issues:

1. Check console logs (both frontend and backend)
2. Verify all files are saved
3. Restart both frontend and backend
4. Clear app cache
5. Check network connectivity

For more details, see `docs/REALTIME_NOTIFICATIONS.md`
