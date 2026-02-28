# Persistent Authentication Setup

## Overview
The app now implements persistent authentication using AsyncStorage. Users will remain logged in even after closing the app or refreshing.

## What Was Changed

### 1. **App.js**
- Added AsyncStorage import
- Added authentication check on app startup
- Shows loading screen while checking auth status
- Automatically navigates to UserDashboard if user is logged in
- Otherwise shows the normal Splash screen

### 2. **UserLogin.js**
- Added AsyncStorage import
- Saves user token and data to AsyncStorage on successful login
- Data persists across app restarts

### 3. **UserDashboard.js**
- Added AsyncStorage import
- Loads user data from AsyncStorage if not passed via navigation
- Clears AsyncStorage on logout
- Shows loading screen while checking stored auth data

### 4. **package.json**
- Added `@react-native-async-storage/async-storage` dependency

## Installation

Run the following command in the `frontend` directory:

```bash
npm install
```

Or if using yarn:

```bash
yarn install
```

## How It Works

### Login Flow:
1. User enters credentials and logs in
2. On successful login, token and user data are saved to AsyncStorage
3. User is navigated to UserDashboard

### App Restart Flow:
1. App checks AsyncStorage for stored token and user data
2. If found, user is automatically logged in and taken to UserDashboard
3. If not found, user sees the normal Splash → Home → Login flow

### Logout Flow:
1. User clicks logout
2. AsyncStorage is cleared (token and user data removed)
3. User is navigated back to Home screen
4. Next time app opens, user will need to login again

## Data Stored in AsyncStorage

- **userToken**: JWT authentication token
- **userData**: JSON string containing user information (id, fullName, email, gender, isEmailVerified)

## Testing

1. Login to the app
2. Close the app completely (swipe away from recent apps)
3. Reopen the app
4. You should be automatically logged in and see the UserDashboard
5. Click logout
6. Close and reopen the app
7. You should see the Splash screen and need to login again

## Security Notes

- AsyncStorage is unencrypted by default
- For production apps with sensitive data, consider using:
  - expo-secure-store for encrypted storage
  - Token refresh mechanisms
  - Token expiration handling
