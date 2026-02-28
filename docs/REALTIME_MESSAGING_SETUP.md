# Real-Time Messaging Setup Guide

This guide explains how to set up and use the real-time messaging feature in Trash2Action.

## Overview

The messaging system uses Socket.IO for real-time bidirectional communication between users. Messages are stored in MongoDB and delivered instantly when both users are online.

## Installation

### Backend Setup

1. Install Socket.IO dependency:
```bash
cd backend
npm install
```

2. The server will automatically start with Socket.IO support on the same port (5000).

### Frontend Setup

1. Install Socket.IO client:
```bash
cd frontend
npm install
```

2. The socket service is already configured in `frontend/services/socket.js`.

## Features

### Real-Time Messaging
- Instant message delivery when both users are online
- Message persistence in MongoDB
- Message history loading
- Read receipts

### Typing Indicators
- Shows when the other user is typing
- Automatically clears after 2 seconds of inactivity

### User Presence
- Automatic connection when user logs in
- Automatic disconnection on logout
- Room-based messaging (each user has their own room)

## How It Works

### Backend (server.js)

1. **Socket.IO Server**: Initialized with the Express server
2. **Message Schema**: Stores messages with conversation IDs
3. **Endpoints**:
   - `GET /api/messages/:userId` - Get conversation history
   - `POST /api/messages/:userId` - Send a new message
   - `PUT /api/messages/:userId/read` - Mark messages as read

4. **Socket Events**:
   - `join` - User joins their room
   - `typing` - User is typing
   - `stop_typing` - User stopped typing
   - `new_message` - New message received

### Frontend

1. **Socket Service** (`frontend/services/socket.js`):
   - Singleton service managing Socket.IO connection
   - Handles connection, disconnection, and event listeners
   - Provides methods for emitting and listening to events

2. **Components**:
   - **UserProfile.js**: Messaging from followers/following lists
   - **UserNF.js**: Messaging from user profiles in newsfeed

## Usage

### Sending Messages

1. Click on a user's name or profile
2. Type your message in the input field
3. Press send or hit enter
4. Message is instantly delivered if recipient is online

### Receiving Messages

- Messages appear automatically in the chat window
- Typing indicators show when the other user is typing
- Messages are marked as read when you view them

## API Endpoints

### Get Messages
```
GET /api/messages/:userId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "messages": [
    {
      "id": "...",
      "text": "Hello!",
      "sender": "me",
      "time": "10:30 AM",
      "read": true
    }
  ]
}
```

### Send Message
```
POST /api/messages/:userId
Authorization: Bearer <token>
Body: { "text": "Hello!" }

Response:
{
  "success": true,
  "message": {
    "id": "...",
    "text": "Hello!",
    "sender": "me",
    "time": "10:30 AM"
  }
}
```

### Mark as Read
```
PUT /api/messages/:userId/read
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Messages marked as read"
}
```

## Socket Events

### Client → Server

- `join(userId)` - Join user's room
- `typing({ senderId, receiverId })` - Notify typing
- `stop_typing({ senderId, receiverId })` - Stop typing notification

### Server → Client

- `new_message(message)` - Receive new message
- `user_typing({ userId })` - User is typing
- `user_stop_typing({ userId })` - User stopped typing

## Troubleshooting

### Messages Not Sending

1. Check if Socket.IO is connected:
   - Look for "✅ Socket connected" in console
   - Check backend logs for connection

2. Verify API_URL in `frontend/config.js`:
   - Should point to your backend server
   - Example: `http://192.168.1.100:5000/api`

3. Check authentication:
   - Ensure user is logged in
   - Token should be valid

### Typing Indicators Not Working

1. Ensure both users are connected to Socket.IO
2. Check console for typing events
3. Verify user IDs are correct

### Connection Issues

1. Backend must be running on the same network
2. Firewall should allow connections on port 5000
3. Check CORS settings in backend

## Testing

1. Start backend server:
```bash
cd backend
npm start
```

2. Start frontend:
```bash
cd frontend
npm start
```

3. Open app on two devices or simulators
4. Login with different accounts
5. Start a conversation and test:
   - Message sending/receiving
   - Typing indicators
   - Message persistence

## Security Notes

- All messages require authentication
- Messages are stored with conversation IDs
- Only participants can view their messages
- Socket connections are validated on join

## Future Enhancements

- Message encryption
- File/image sharing in messages
- Group messaging
- Message notifications
- Online/offline status indicators
- Message deletion
- Message editing
