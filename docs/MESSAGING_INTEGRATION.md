# Messaging System Integration

## Overview
Integrated real-time messaging functionality with database backend and Socket.IO for the Trash2Action app.

## Backend Changes (server.js)

### New API Endpoint
Added `/api/conversations` endpoint to fetch all conversations for the current user:
- Returns list of conversations with latest message
- Includes unread message count per conversation
- Sorted by most recent activity
- Requires authentication

### Existing Endpoints Used
- `GET /api/messages/:userId` - Get all messages in a conversation
- `POST /api/messages/:userId` - Send a new message
- `PUT /api/messages/:userId/read` - Mark messages as read

### Socket.IO Events
**Server Emits:**
- `new_message` - Sent to receiver when a new message arrives
- `user_typing` - Sent to receiver when sender starts typing
- `user_stop_typing` - Sent to receiver when sender stops typing

**Server Listens:**
- `join` - User joins their personal room for receiving messages
- `typing` - User started typing
- `stop_typing` - User stopped typing

## Frontend Changes (UserMessage.js)

### Real-time Features Implemented
1. **Instant Message Delivery**
   - Messages appear immediately when sent by other user
   - Uses Socket.IO for real-time communication
   - Auto-scrolls to new messages

2. **Typing Indicators**
   - Shows "User is typing..." when other person types
   - Animated dots indicator
   - Automatically stops after 2 seconds of inactivity

3. **Conversation List**
   - Fetches real conversations from database
   - Shows user avatars, names, and last message
   - Displays unread message count badges
   - Pull-to-refresh functionality
   - Empty state when no conversations exist
   - Updates in real-time when new messages arrive

4. **Chat Interface**
   - Loads real message history from database
   - Sends messages to backend API
   - Auto-scrolls to latest messages
   - Marks messages as read when opened
   - Shows message timestamps
   - Real-time message reception

### Socket.IO Integration
- Connects automatically when component mounts
- Joins user's personal room using their ID
- Listens for incoming messages
- Emits typing events with debouncing
- Cleans up listeners on unmount
- Handles reconnection automatically

### API Integration
- Uses `API_URL` from config.js for dynamic backend URL
- Includes JWT token in all requests for authentication
- Proper error handling with user alerts
- Loading states during API calls

## Database Schema (Message Model)
```javascript
{
  conversationId: String (indexed),
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  text: String,
  read: Boolean,
  createdAt: Date
}
```

## Usage
1. Click the green message bubble in bottom-right corner of UserDashboard
2. View all your conversations with unread counts
3. Tap a conversation to open the chat
4. Send and receive messages in real-time
5. See typing indicators when other person is typing
6. Messages are automatically marked as read

## Technical Implementation

### Real-time Message Flow
1. User A types and sends a message
2. Frontend sends POST request to `/api/messages/:userId`
3. Backend saves message to database
4. Backend emits `new_message` event via Socket.IO to User B's room
5. User B's frontend receives the event and displays the message instantly
6. Conversation list updates automatically

### Typing Indicator Flow
1. User A starts typing
2. Frontend emits `typing` event with 2-second debounce
3. Backend forwards event to User B's room
4. User B sees "User A is typing..." indicator
5. After 2 seconds of no typing, `stop_typing` event is sent
6. Typing indicator disappears

## Future Enhancements
- Online/offline status indicators
- Message delivery/read receipts
- Image/file attachments
- Push notifications for new messages
- Message search functionality
- Delete/edit messages
- Group conversations
