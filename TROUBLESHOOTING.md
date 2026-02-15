# Troubleshooting Guide

## Common Issues and Solutions

### 1. Metro Bundler Cache Issues

**Problem**: Changes to components not reflecting in the app

**Solution**:
```bash
cd frontend
npm start -- --reset-cache
```

### 2. Network Connection Issues

**Problem**: Frontend can't connect to backend

**Solutions**:
- Ensure both devices are on the same WiFi network
- Check that backend is running and showing network IP
- Verify frontend config.js is using correct API_URL
- Check firewall settings aren't blocking port 5000

**Test backend connectivity**:
```bash
# From your phone's browser, visit:
http://YOUR_COMPUTER_IP:5000/health
```

### 3. Email Verification Not Working

**Problem**: Verification emails not being received

**Solutions**:
- Check spam/junk folder
- Verify .env file has correct email credentials
- For Gmail, ensure "App Password" is used (not regular password)
- Check backend console for email sending errors

### 4. ADMIN Account Can't Login

**Problem**: ADMIN account shows "pending approval" or "email not verified"

**Current Behavior** (FIXED):
- ADMIN accounts don't need email verification
- They only need approval from existing admin
- Once approved, they can login immediately

**If still having issues**:
- Check account status in database
- Verify `isApproved: true` and `isEmailVerified: true`
- Check backend logs for login errors

### 5. BARANGAY/POSO Account Can't Login

**Problem**: Account created but can't login

**Solution**:
- Must verify email first
- Check email for verification link
- Click link to activate account
- Then try logging in again

### 6. Employee ID Already Exists

**Problem**: Registration fails with "Employee ID already registered"

**Solution**:
- Employee IDs must be unique across all responders
- Use a different employee ID
- Contact admin if you believe this is an error

### 7. Position Field Issues

**Problem**: Position field showing when it shouldn't

**Solution**:
- Position field should be hidden for ADMIN account type
- Position field is required for BARANGAY/POSO account types
- If field is not hiding, check that accountType is set correctly

### 8. Navigation Errors

**Problem**: "GO_BACK action not handled" or navigation errors

**Solution**:
- Ensure all screens use `navigation` prop correctly
- Use `navigation.goBack()` instead of callback props
- Use `navigation.navigate('ScreenName')` to navigate
- Clear metro cache if issues persist

### 9. Keyboard Covering Input Fields

**Problem**: Can't see password fields when keyboard is open

**Solution** (FIXED):
- ResponderLogin and ResponderRegister now use KeyboardAvoidingView
- Reduced spacing to fit all fields
- If still having issues, try scrolling the form

### 10. Import/Module Resolution Errors

**Problem**: "Unable to resolve module" errors

**Solutions**:
- Check file path is correct (case-sensitive)
- Ensure file exists at specified location
- Clear metro cache: `npm start -- --reset-cache`
- Restart metro bundler

### 11. Database Connection Issues

**Problem**: Backend can't connect to MongoDB

**Solutions**:
- Check .env file has correct MONGO_URI
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas (allow all: 0.0.0.0/0)
- Test connection string in MongoDB Compass

### 12. JWT Token Issues

**Problem**: "Invalid token" or authentication errors

**Solutions**:
- Check JWT_SECRET is set in .env
- Token expires after 7 days - login again
- Clear app data and login again
- Verify token is being sent in Authorization header

## Development Tips

### Starting the Application

1. **Start Backend**:
```bash
cd backend
npm start
```

2. **Start Frontend**:
```bash
cd frontend
npm start
```

3. **Scan QR code** with Expo Go app on your phone

### Checking Logs

**Backend logs**:
- Check terminal where backend is running
- Look for error messages and stack traces

**Frontend logs**:
- Shake device to open Expo menu
- Tap "Debug Remote JS"
- Open Chrome DevTools console

### Testing Email Functionality

1. Use a real email address during testing
2. Check spam folder if email doesn't arrive
3. Verification links expire after 1 hour
4. Use "Resend Verification" if link expires

### Database Inspection

Use MongoDB Compass or Atlas web interface to:
- View user/responder documents
- Check field values (isApproved, isEmailVerified, etc.)
- Manually update documents if needed for testing

## Quick Fixes

### Reset Everything
```bash
# Stop all processes
# Clear metro cache
cd frontend
npm start -- --reset-cache

# Restart backend
cd backend
npm start
```

### Force Refresh App
- Shake device
- Tap "Reload"
- Or press 'r' in metro terminal

### Clear App Data
- Uninstall Expo Go app
- Reinstall from app store
- Scan QR code again

## Getting Help

If issues persist:
1. Check backend console for errors
2. Check frontend metro bundler for errors
3. Review relevant documentation files
4. Check that all dependencies are installed
5. Verify .env file is configured correctly

## Recent Fixes Applied

### ADMIN Approval Flow (Latest)
- ADMIN accounts no longer require email verification
- They are pre-verified (`isEmailVerified: true`)
- Only approval is needed to login
- Approval email no longer contains verification link
- Login endpoint skips email verification check for ADMIN accounts

### Previous Fixes
- Added KeyboardAvoidingView to responder forms
- Fixed navigation props (removed callback props)
- Added dynamic network configuration
- Added account type dropdown
- Implemented employee ID uniqueness validation
- Added approval system for ADMIN accounts
