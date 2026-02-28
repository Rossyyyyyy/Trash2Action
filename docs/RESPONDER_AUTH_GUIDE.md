# Responder Authentication System

## Overview

The responder authentication system allows authorized personnel (Admin, Barangay, POSO) to create accounts and access the system. Email verification is required before login.

## Features

### Account Types
- **ADMIN** - System administrators
- **BARANGAY** - Barangay officials
- **POSO** - POSO (Public Order and Safety Office) personnel

### Registration Process

1. **Immediate Account Creation**
   - No approval needed - accounts are created instantly
   - All fields are required
   - Password must be at least 8 characters with 1 capital letter and 1 number

2. **Email Verification**
   - Verification email sent immediately after registration
   - Link expires in 1 hour
   - Can resend verification email if needed

3. **Required Information**
   - Full Name
   - Account Type (ADMIN/BARANGAY/POSO)
   - Employee ID (must be unique)
   - Email (must be unique)
   - Phone Number
   - Barangay
   - Position (not required for ADMIN - automatically set to "Administrator")
   - Password

### Login Process

1. **Select Account Type**
   - Must match the type selected during registration

2. **Enter Credentials**
   - Employee ID
   - Password

3. **Email Verification Check**
   - Cannot login until email is verified
   - Option to resend verification email from login screen

## API Endpoints

### Register Responder
```
POST /api/responder/register

Body:
{
  "fullName": "Juan Dela Cruz",
  "accountType": "BARANGAY",
  "employeeId": "BRG-2024-001",
  "email": "juan@example.com",
  "phone": "09123456789",
  "barangay": "Barangay Taguig",
  "position": "Barangay Tanod",
  "password": "SecurePass123"
}

Response (Success):
{
  "success": true,
  "message": "Responder account created! Please check your email to verify your account."
}
```

### Login Responder
```
POST /api/responder/login

Body:
{
  "employeeId": "BRG-2024-001",
  "accountType": "BARANGAY",
  "password": "SecurePass123"
}

Response (Success):
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "responder": {
    "id": "...",
    "fullName": "Juan Dela Cruz",
    "accountType": "BARANGAY",
    "employeeId": "BRG-2024-001",
    "email": "juan@example.com",
    "phone": "09123456789",
    "barangay": "Barangay Taguig",
    "position": "Barangay Tanod",
    "isEmailVerified": true
  }
}

Response (Email Not Verified):
{
  "success": false,
  "message": "Email not verified. Please check your inbox or resend verification.",
  "needsVerification": true
}
```

### Resend Verification Email
```
POST /api/responder/resend-verification

Body:
{
  "email": "juan@example.com"
}

Response:
{
  "success": true,
  "message": "Verification email resent successfully"
}
```

### Verify Email
```
GET /verify-email?token=verification_token

Response: HTML page showing verification status
```

## Database Schema

### Responder Collection
```javascript
{
  fullName: String (required),
  accountType: String (required, enum: ["ADMIN", "BARANGAY", "POSO"]),
  employeeId: String (required, unique),
  email: String (required, unique, lowercase),
  phone: String (required),
  barangay: String (required),
  position: String (default: "Administrator"),
  password: String (required, hashed),
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String,
  emailVerificationExpiry: Date,
  passwordResetCode: String,
  passwordResetExpiry: Date,
  createdAt: Date (default: now)
}
```

**Note:** Position field is automatically set to "Administrator" for ADMIN accounts and is not shown in the registration form.

## Security Features

1. **Password Hashing**
   - Passwords are hashed using bcrypt with salt rounds of 10

2. **Email Verification**
   - Required before login
   - Token expires in 1 hour
   - Secure random token generation

3. **JWT Authentication**
   - Token expires in 7 days
   - Includes responder ID and type

4. **Unique Constraints**
   - Employee ID must be unique
   - Email must be unique

## User Flow

### Registration Flow
```
1. User opens ResponderRegister screen
2. Fills in all required fields
3. Selects account type from dropdown
4. Clicks "Create Account"
5. Account created immediately
6. Verification email sent
7. User sees "Check Your Email" screen
8. User clicks verification link in email
9. Email verified - can now login
```

### Login Flow
```
1. User opens ResponderLogin screen
2. Selects account type from dropdown
3. Enters employee ID and password
4. Clicks "Login"
5. System checks if email is verified
   - If not verified: Shows error with resend option
   - If verified: Login successful
6. User redirected to Responder Dashboard (TODO)
```

## Error Handling

### Registration Errors
- Missing required fields
- Invalid email format
- Employee ID already exists
- Email already registered
- Password doesn't meet requirements
- Passwords don't match

### Login Errors
- Missing required fields
- Invalid credentials
- Email not verified
- Network errors

## Testing

### Test Registration
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Navigate to Responder Registration
4. Fill in all fields with valid data
5. Submit and check email for verification link

### Test Login
1. Complete registration and verify email
2. Navigate to Responder Login
3. Select correct account type
4. Enter employee ID and password
5. Should login successfully

### Test Email Verification
1. Register a new account
2. Check email inbox (and spam folder)
3. Click verification link
4. Should see success message
5. Try to login - should work

## Next Steps

- [ ] Create Responder Dashboard
- [ ] Add password reset functionality for responders
- [ ] Add profile management for responders
- [ ] Add role-based permissions
- [ ] Add admin panel to manage responders
