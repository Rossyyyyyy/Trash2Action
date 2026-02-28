# Message Sender Attribution Fix

## Problem
When User 2 replies to User 1's message, the reply appears as if User 1 sent it instead of User 2.

**Example:**
- User 1 says: "hi"
- User 2 says: "hello"
- But "hello" shows as sent by User 1 ❌

## Root Cause

The backend was sending messages via Socket.IO with a hardcoded `sender: "them"` field:

```javascript
// Backend - server.js
io.to(`user_${userId}`).emit("new_message", {
  ...formattedMessage,
  sender: "them",  // ❌ Always "them" regardless of actual sender
});
```

The frontend was using this field directly without checking who actually sent the message based on the `senderId`.

## Solution

The frontend now determines the sender by comparing the message's `senderId` with the current user's ID:

```javascript
// Frontend - UserProfile.js & UserNF.js
socketService.onNewMessage((message) => {
  const formattedMessage = {
    ...message,
    // ✅ Check actual senderId vs current userId
    sender: String(message.senderId) === String(userId) ? "me" : "them"
  };
  
  setMessages((prev) => [...prev, formattedMessage]);
});
```

## How It Works

### Message Flow

1. **User 1 sends "hi":**
   - API returns: `{ senderId: "user1_id", sender: "me" }`
   - User 1 sees: "hi" on the right (green bubble)
   - Socket.IO sends to User 2: `{ senderId: "user1_id", sender: "them" }`
   - Frontend checks: `"user1_id" === "user2_id"` → false → `sender: "them"`
   - User 2 sees: "hi" on the left (gray bubble) ✅

2. **User 2 replies "hello":**
   - API returns: `{ senderId: "user2_id", sender: "me" }`
   - User 2 sees: "hello" on the right (green bubble)
   - Socket.IO sends to User 1: `{ senderId: "user2_id", sender: "them" }`
   - Frontend checks: `"user2_id" === "user1_id"` → false → `sender: "them"`
   - User 1 sees: "hello" on the left (gray bubble) ✅

### Key Changes

**Before:**
```javascript
// Used backend's sender field directly
setMessages((prev) => [...prev, message]);
// message.sender was always "them" from Socket.IO
```

**After:**
```javascript
// Determine sender based on actual senderId
const formattedMessage = {
  ...message,
  sender: String(message.senderId) === String(userId) ? "me" : "them"
};
setMessages((prev) => [...prev, formattedMessage]);
```

## Files Updated

- ✅ `frontend/components/User/Dashboard/UserProfile.js`
- ✅ `frontend/components/User/Dashboard/UserNF.js`

## Debug Logs Added

You'll now see helpful logs to verify sender attribution:

```
📨 New message received: { id: "...", senderId: "user2_id", text: "hello" }
📨 Message senderId: user2_id Current userId: user1_id
📨 Formatted message sender: them
```

## Testing

### Test Case 1: User 1 → User 2
1. User 1 sends "hi"
2. User 1 should see "hi" on the right (green)
3. User 2 should see "hi" on the left (gray)

### Test Case 2: User 2 → User 1
1. User 2 sends "hello"
2. User 2 should see "hello" on the right (green)
3. User 1 should see "hello" on the left (gray)

### Test Case 3: Conversation
1. User 1: "How are you?"
2. User 2: "I'm good, thanks!"
3. User 1: "Great!"
4. Each user should see their own messages on the right
5. Each user should see other's messages on the left

## Why String Conversion?

```javascript
String(message.senderId) === String(userId)
```

MongoDB ObjectIDs can be objects or strings depending on context:
- `ObjectId("507f1f77bcf86cd799439011")`
- `"507f1f77bcf86cd799439011"`

Converting both to strings ensures reliable comparison.

## Visual Verification

**User 1's View:**
```
┌─────────────────────────┐
│ User 2                  │
├─────────────────────────┤
│                         │
│  ┌──────────┐          │  ← User 2's message (gray, left)
│  │ hello    │          │
│  └──────────┘          │
│                         │
│          ┌──────────┐  │  ← User 1's message (green, right)
│          │ hi       │  │
│          └──────────┘  │
└─────────────────────────┘
```

**User 2's View:**
```
┌─────────────────────────┐
│ User 1                  │
├─────────────────────────┤
│                         │
│  ┌──────────┐          │  ← User 1's message (gray, left)
│  │ hi       │          │
│  └──────────┘          │
│                         │
│          ┌──────────┐  │  ← User 2's message (green, right)
│          │ hello    │  │
│          └──────────┘  │
└─────────────────────────┘
```

## Common Issues

### Issue: All messages show on the same side
**Cause:** Not comparing senderId correctly
**Fix:** Ensure String conversion and correct comparison

### Issue: Messages flip sides randomly
**Cause:** Using state variable that hasn't updated yet
**Fix:** Use the userId from AsyncStorage directly in closure

### Issue: Own messages show as "them"
**Cause:** Comparing wrong IDs
**Fix:** Log both IDs to verify they match

## Verification Checklist

- ✅ User 1 sends message → appears on right for User 1
- ✅ User 1 sends message → appears on left for User 2
- ✅ User 2 sends message → appears on right for User 2
- ✅ User 2 sends message → appears on left for User 1
- ✅ Console logs show correct senderId comparison
- ✅ No messages attributed to wrong sender

## Summary

The fix ensures that:
1. ✅ Each user sees their own messages on the right (green)
2. ✅ Each user sees other's messages on the left (gray)
3. ✅ Sender attribution is based on actual senderId
4. ✅ Works correctly for all users in all scenarios

No more misattributed messages! 🎉
