# Trash2Action 🌿

A mobile application for reporting and managing illegal trash dumping in creeks and waterways. Built with React Native (Expo) and Node.js.

## 📱 Features

### For Users
- Report illegal dumping with photos and location
- Track report status (Pending, Resolved, Rejected)
- View newsfeed and updates
- Receive notifications
- Email verification system

### For Responders (Barangay/POSO)
- View and manage reports
- Update report status
- Field team coordination
- Email verification required

### For Administrators
- **Beautiful Dashboard** with analytics and charts
- **Admin Approval System** - Review and approve admin account requests
- **User Management** - View active users, banned users
- **Responder Management** - Manage field teams
- **Reports Overview** - Monitor all reports with statistics
- **Newsfeed** - Post updates and announcements
- **Notifications** - Real-time alerts
- Pre-verified accounts (no email verification needed)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Gmail account for email notifications
- Expo Go app on your phone

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Rossyyyyyy/Trash2Action.git
cd Trash2Action
```

2. **Setup Backend**
```bash
cd backend
npm install
```

3. **Configure Environment Variables**

Create `backend/.env` file:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
BASE_URL=http://your_ip:5000
```

4. **Setup Frontend**
```bash
cd frontend
npm install
```

5. **Start the Application**

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

6. **Open on Phone**
- Scan QR code with Expo Go app
- Ensure phone and computer are on same WiFi network

## 📖 Documentation

- [Quick Start Guide](QUICK_START.md)
- [Network Setup](NETWORK_SETUP.md)
- [Admin Approval System](ADMIN_APPROVAL_SYSTEM.md)
- [Admin Dashboard Guide](ADMIN_DASHBOARD_GUIDE.md)
- [Responder Authentication](RESPONDER_AUTH_GUIDE.md)
- [Testing Admin Flow](TESTING_ADMIN_FLOW.md)
- [Troubleshooting](TROUBLESHOOTING.md)

## 🏗️ Project Structure

```
Trash2Action/
├── backend/
│   ├── server.js          # Main server file
│   ├── start.js           # Server startup script
│   ├── package.json
│   └── .env              # Environment variables (create this)
├── frontend/
│   ├── App.js            # Main app component
│   ├── config.js         # Dynamic API configuration
│   ├── components/
│   │   ├── Out/          # Landing screens
│   │   ├── User/         # User components
│   │   └── Responders/   # Responder & Admin components
│   │       └── Admin/    # Admin dashboard components
│   ├── assets/
│   └── package.json
└── README.md
```

## 🎨 Admin Dashboard Features

### Home Screen
- **Statistics Cards** - Total reports, pending, resolved, active users
- **Weekly Chart** - Visual representation of reports over 7 days
- **Quick Actions** - Fast access to common tasks
- **Recent Reports** - Latest submissions with status

### Newsfeed
- System updates and announcements
- Engagement features (like, comment, share)
- Achievement notifications

### Notifications
- Real-time alerts for admin requests
- Urgent report notifications
- User activity updates
- Clickable notifications for quick actions

### Profile
- Account information display
- Settings and preferences
- Security options
- Logout functionality

## 🔐 Account Types

### User
- Register with email verification
- Submit reports
- Track submissions

### Responder (Barangay/POSO)
- Register with email verification
- Auto-approved accounts
- Manage assigned reports

### Admin
- Request account (requires approval)
- No email verification needed
- Full system access after approval
- Manage users, responders, and reports

## 🛠️ Technology Stack

**Frontend:**
- React Native (Expo)
- React Navigation
- Expo Linear Gradient
- Expo Image Picker
- Expo Location

**Backend:**
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Bcrypt
- Nodemailer

## 📧 Email Features

- User email verification
- Responder email verification
- Admin request notifications
- Admin approval/rejection emails
- Password reset (coming soon)

## 🌐 Network Configuration

The app uses dynamic network detection:
- Backend auto-detects local IP
- Frontend uses Expo's network detection
- Works on any WiFi network
- No hardcoded IP addresses

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Email verification
- Admin approval system
- Employee ID uniqueness validation
- Secure environment variables

## 📱 Supported Platforms

- iOS (via Expo Go)
- Android (via Expo Go)
- Web (limited support)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Hermione Soleil** - Initial work

## 🙏 Acknowledgments

- Barangay officials for their support
- Community members for feedback
- Open source community

## 📞 Support

For issues and questions:
- Email: roschelmaeanoos@gmail.com
- GitHub Issues: [Create an issue](https://github.com/Rossyyyyyy/Trash2Action/issues)

## 🗺️ Roadmap

- [ ] Push notifications
- [ ] Real-time chat between users and responders
- [ ] Advanced analytics dashboard
- [ ] Report filtering and search
- [ ] Export reports to PDF
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Offline mode support

---

Made with ❤️ for cleaner waterways
