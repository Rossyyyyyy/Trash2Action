# Real-Time Notification System

## Overview
The admin notification system now supports real-time updates using Socket.IO. Admins are instantly notified when users submit reports, create posts, or when new admin requests are made.

## Features

### 1. Real-Time Notifications
- Admins receive instant notifications without refreshing
- Socket.IO connection established on login
- Notifications appear immediately in the notification center

### 2. Notification Types
- **Admin Request**: New admin account requests
- **Post**: User creates a new post in the newsfeed
- **Report**: User submits a new report (ready for implementation)
- **Comment**: Someone comments on a post
- **Like**: Someone likes a post
- **System**: General system notifications

### 3. Notification Features
- Unread count badge on notification icon
- Mark individual notifications as read
- Mark all notifications as read
- Delete notifications (long press)
- Navigate to related content on tap
- Pull to refresh

## Technical Implementation

### Backend (server.js)

#### Notification Schema
```javascript
{
  recipientId: ObjectId,           // Admin/Responder ID
  recipientType: String,           // "user" or "responder"
  type: String,                    // Notification type
  title: String,                   // Notification title
  message: String,                 // Notification message
  relatedId: ObjectId,             // Related post/report ID
  relatedType: String,             // "post", "report", etc.
  read: Boolean,                   // Read status
  createdAt: Date                  // Timestamp
}
```

#### Socket.IO Events
- `join`: User joins their notification room
- `new_notification`: Emitted when a new notification is created

#### API Endpoints
- `GET /api/notifications` - Get all notifications for a user
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Frontend

#### Socket Service (services/socket.js)
```javascript
// Listen for notifications
socketService.onNewNotification((notification) => {
  // Handle new notification
});

// Remove listener
socketService.offNewNotification();
```

#### AdminNotif Component
- Connects to Socket.IO on mount
- Listens for `new_notification` events
- Fetches initial notifications from API
- Updates UI in real-time
- Shows unread count badge

#### AdminDashboard Component
- Shows unread count on notification icon
- Updates badge in real-time
- Connects to Socket.IO

## Usage

### For Admins
1. Login to admin account
2. Socket.IO connection is established automatically
3. Notifications appear in real-time
4. Click notification icon to view all notifications
5. Tap notification to navigate to related content
6. Long press to delete notification
7. Use "Mark all read" button to clear unread status

### Testing
1. Login as admin
2. In another device/browser, login as user
3. Create a post or submit a report
4. Admin should receive notification instantly
5. Check notification badge updates in real-time

## Future Enhancements

### Planned Features
- [ ] Report submission notifications
- [ ] Comment notifications
- [ ] Like notifications
- [ ] Push notifications (Expo Notifications)
- [ ] Notification preferences/settings
- [ ] Notification sound/vibration
- [ ] Notification grouping
- [ ] Notification history pagination

### Implementation Notes

#### Adding Report Notifications
When implementing report submission, add this code after saving the report:

```javascript
// Create notification for all admins
const admins = await Responder.find({ accountType: "ADMIN", isApproved: true });
const notifications = admins.map(admin => ({
  recipientId: admin._id,
  recipientType: "responder",
  type: "report",
  title: "New Report Submitted",
  message: `${user.fullName} reported ${reportType} at ${location}`,
  relatedId: newReport._id,
  relatedType: "report",
}));

if (notifications.length > 0) {
  await Notification.insertMany(notifications);
  
  // Emit real-time notification
  admins.forEach(admin => {
    io.to(`user_${admin._id}`).emit("new_notification", {
      type: "report",
      title: "New Report Submitted",
      message: `${user.fullName} reported ${reportType} at ${location}`,
      timestamp: new Date(),
    });
  });
}
```

## Troubleshooting

### Notifications Not Appearing
1. Check Socket.IO connection in console logs
2. Verify admin is logged in with valid token
3. Check network connectivity
4. Restart the backend server
5. Clear app cache and reload

### Badge Count Not Updating
1. Pull to refresh on dashboard
2. Check API endpoint response
3. Verify Socket.IO listener is active
4. Check console for errors

### Connection Issues
1. Ensure backend server is running
2. Check API_URL in config.js
3. Verify Socket.IO server is initialized
4. Check firewall/network settings

## Related Files
- `backend/server.js` - Notification schema and endpoints
- `frontend/services/socket.js` - Socket.IO service
- `frontend/components/Responders/Admin/AdminNotif.js` - Notification UI
- `frontend/components/Responders/Admin/AdminDashboard.js` - Dashboard with badge
- `frontend/config.js` - API configuration
