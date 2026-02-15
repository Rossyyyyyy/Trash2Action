# Admin Dashboard Guide

## Overview

The Admin Dashboard is a comprehensive management interface for administrators to monitor and manage the Trash2Action system.

## Features

### Footer Navigation

The dashboard includes a bottom navigation bar with 4 main sections:

1. **Home** - Main dashboard with tabs for different management areas
2. **Newsfeed** - Latest updates and announcements
3. **Notifications** - System alerts and notifications
4. **Profile** - Admin profile and settings

### Home Screen Tabs

The Home screen contains 5 tabs for different management functions:

#### 1. Reports Tab
- **Statistics Cards:**
  - Total Reports (24)
  - Pending Reports (8)
  - Resolved Reports (12)
  - Rejected Reports (4)
- **Recent Reports List** (Coming soon)

#### 2. Users Tab
- **Statistics:**
  - Total Users (156)
  - New Users Today (12)
- **User Management List** (Coming soon)

#### 3. Banned Users Tab
- **Statistics:**
  - Banned Users (3)
  - Warnings Issued (7)
- **Banned Users List** (Coming soon)

#### 4. Responders Tab
- **Statistics:**
  - Active Responders (8)
  - Pending Responders (2)
- **Responder Management** (Coming soon)

#### 5. Analytics Tab
- System analytics and charts (Coming soon)

## Navigation Flow

```
ResponderLogin (ADMIN account)
    ↓
AdminDashboard
    ├── Home (with tabs)
    │   ├── Reports
    │   ├── Users
    │   ├── Banned Users
    │   ├── Responders
    │   └── Analytics
    ├── Newsfeed
    ├── Notifications
    └── Profile
```

## Access

- Only responders with `accountType: "ADMIN"` can access this dashboard
- Login through ResponderLogin screen
- Select "Admin" as account type
- Enter admin credentials

## UI Features

### Header
- Gradient background (green theme)
- Welcome message with admin name
- Logout button (top right)

### Tabs
- Horizontal scrollable tabs
- Active tab highlighted with green underline
- Icons for each tab

### Statistics Cards
- Color-coded by category
- Large numbers for quick viewing
- Icons representing each metric

### Pull to Refresh
- Swipe down to refresh data
- Works on all screens

### Footer Menu
- Fixed at bottom
- Active state highlighting
- Icons with labels

## Design System

### Colors
- Primary: `#2E7D32` (Green)
- Secondary: `#43A047` (Light Green)
- Background: `#F5F5F5` (Light Gray)
- Cards: `#FFFFFF` (White)
- Text: `#212121` (Dark Gray)
- Accent Colors:
  - Blue: `#1976D2` / `#E3F2FD`
  - Orange: `#F57C00` / `#FFF3E0`
  - Green: `#388E3C` / `#E8F5E9`
  - Red: `#D32F2F` / `#FFEBEE`

### Typography
- Header Title: 24px, Bold
- Section Title: 18px, Bold
- Stat Number: 32px, Bold
- Body Text: 14-16px
- Footer Text: 12px

### Spacing
- Card Padding: 20-30px
- Content Padding: 20px
- Gap between elements: 12px
- Bottom padding: 100px (to avoid footer overlap)

## Profile Screen

### Profile Card
- Avatar placeholder
- Admin name
- Account type badge
- Email address

### Menu Items
- Edit Profile
- Change Password
- Settings
- Logout (red color)

## Next Steps

### To Implement:
1. **Reports Management**
   - List all reports
   - Filter by status
   - View report details
   - Approve/Reject reports
   - Assign to responders

2. **User Management**
   - List all users
   - Search and filter
   - View user details
   - Ban/Unban users
   - View user activity

3. **Banned Users**
   - List banned users
   - Reason for ban
   - Unban functionality
   - Ban history

4. **Responder Management**
   - List all responders
   - Approve pending responders
   - Edit responder details
   - Deactivate responders

5. **Analytics**
   - Charts and graphs
   - Trends over time
   - Export reports
   - System statistics

6. **Newsfeed**
   - Create announcements
   - Edit/Delete posts
   - Pin important updates

7. **Notifications**
   - Real-time alerts
   - Mark as read
   - Notification settings

8. **Profile**
   - Edit profile functionality
   - Change password
   - Settings page
   - Activity log

## API Integration

The dashboard is ready for API integration. Add API calls in:
- `onRefresh()` function for data fetching
- Each tab's render function for specific data
- Profile screen for user data

## Testing

1. Login as ADMIN through ResponderLogin
2. Navigate through all footer tabs
3. Switch between home tabs
4. Test pull-to-refresh
5. Test logout functionality

## Responsive Design

- Works on all screen sizes
- Horizontal scrolling for tabs
- Flexible grid layout for stats
- Bottom navigation always visible


## Admin Request Management

### Viewing Pending Requests

1. **Navigate to Responders Tab**
   - Open AdminDashboard
   - Tap on "Responders" tab in the top navigation

2. **Access Admin Requests**
   - Tap on "Admin Account Requests" button
   - Shows count of pending requests

### AdminRequest Screen Features

**Request Card Information:**
- Full name with avatar initial
- Employee ID
- Email address
- Phone number
- Barangay
- Request submission date/time
- Account type badge (ADMIN)

**Actions Available:**
- **Approve**: Grants admin access, sends approval email
- **Reject**: Denies request, sends rejection email
- **Refresh**: Pull to refresh or tap refresh icon

**Statistics:**
- Total pending requests count
- Color-coded status indicators

### Approval Process

1. **Review Request Details**
   - Check employee ID validity
   - Verify email and phone
   - Confirm barangay assignment

2. **Approve Request**
   - Tap "Approve" button
   - Confirm in dialog
   - User receives approval email
   - User can login immediately

3. **Reject Request**
   - Tap "Reject" button
   - Confirm in dialog
   - User receives rejection email
   - User cannot login

### Backend Endpoint

**GET /api/responder/pending-requests**
- Fetches all pending ADMIN account requests
- Sorted by creation date (newest first)
- Excludes password and verification tokens

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "...",
      "fullName": "John Doe",
      "accountType": "ADMIN",
      "employeeId": "EMP001",
      "email": "john@example.com",
      "phone": "09123456789",
      "barangay": "Barangay 1",
      "position": "Administrator",
      "approvalStatus": "pending",
      "isApproved": false,
      "createdAt": "2025-02-15T10:30:00.000Z"
    }
  ]
}
```

### User Experience Flow

1. **User submits ADMIN request** → Request appears in pending list
2. **Admin reviews request** → Opens AdminRequest screen
3. **Admin approves/rejects** → User receives email notification
4. **If approved** → User can login immediately
5. **If rejected** → User sees rejection message on login attempt

### Security Notes

- Only authenticated admins can view pending requests
- Approval/rejection requires admin token
- All actions are logged in backend
- Email notifications sent for all decisions
