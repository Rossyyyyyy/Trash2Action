# Admin Approval System

## Overview

The responder registration system now has different workflows for different account types:

- **ADMIN**: Requires approval before account activation (NO email verification needed)
- **BARANGAY/POSO**: Immediate account creation with email verification

## Workflows

### ADMIN Account Registration

1. **User submits registration**
   - Fills out registration form
   - Selects "Admin" as account type
   - Clicks "Request Account" button

2. **System creates pending account**
   - Account created with:
     - `isEmailVerified: true` (pre-verified, no email verification needed)
     - `isApproved: false`
     - `approvalStatus: "pending"`
   - Password is hashed and stored
   - Request notification email sent

3. **User receives confirmation email**
   - Email confirms request submission
   - States that approval is pending
   - User must wait for admin approval

4. **Admin reviews request**
   - Existing admin logs into AdminDashboard
   - Views pending admin requests
   - Approves or rejects the request

5. **User receives approval/rejection email**
   - **If Approved:**
     - Email notifies user account is ready
     - User can immediately login (no email verification needed)
   - **If Rejected:**
     - Email explains rejection
     - User cannot login with this account

6. **User logs in (if approved)**
   - Can login immediately after approval
   - No email verification step required

### BARANGAY/POSO Account Registration

1. **User submits registration**
   - Fills out registration form
   - Selects "Barangay" or "POSO" as account type
   - Clicks "Create Account" button

2. **System creates account immediately**
   - Account created with:
     - `isEmailVerified: false`
     - `isApproved: true` (auto-approved)
     - `approvalStatus: "approved"`
   - Verification email sent immediately

3. **User verifies email**
   - Clicks verification link in email
   - Account is activated
   - Can login immediately

## Database Schema Updates

### Responder Collection

```javascript
{
  // ... existing fields ...
  isEmailVerified: Boolean (true for ADMIN, false for BARANGAY/POSO initially),
  isApproved: Boolean (false for ADMIN, true for BARANGAY/POSO),
  approvalStatus: String (enum: ["pending", "approved", "rejected"]),
  emailVerificationToken: String (null for ADMIN, generated for BARANGAY/POSO),
  emailVerificationExpiry: Date (null for ADMIN, set for BARANGAY/POSO),
}
```

## API Endpoints

### Register Responder
```
POST /api/responder/register

Response for ADMIN:
{
  "success": true,
  "message": "Admin account request submitted! You'll receive an email once your request is reviewed.",
  "requiresApproval": true
}

Response for BARANGAY/POSO:
{
  "success": true,
  "message": "Account created! Please check your email to verify your account.",
  "requiresApproval": false
}
```

### Login Responder
```
POST /api/responder/login

Response for unapproved ADMIN (403):
{
  "success": false,
  "message": "Your admin account request is pending approval...",
  "needsApproval": true,
  "approvalStatus": "pending"
}

Response for rejected ADMIN (403):
{
  "success": false,
  "message": "Your admin account request has been rejected...",
  "needsApproval": true,
  "approvalStatus": "rejected"
}

Response for unverified BARANGAY/POSO (403):
{
  "success": false,
  "message": "Email not verified. Please check your inbox...",
  "needsVerification": true
}
```

### Approve/Reject Admin Request
```
POST /api/responder/approve-admin

Body:
{
  "responderId": "...",
  "approved": true/false
}

Response:
{
  "success": true,
  "message": "Admin account approved successfully"
}
```

## Email Templates

### 1. Admin Request Submitted
- **Subject**: Admin Account Request Submitted - Trash2Action
- **Content**: Confirms request submission, pending status
- **Sent**: Immediately after ADMIN registration

### 2. Admin Request Approved
- **Subject**: Admin Account Approved - Trash2Action
- **Content**: Approval notification, ready to login message
- **Sent**: When admin approves the request
- **Note**: No verification link (account is pre-verified)

### 3. Admin Request Rejected
- **Subject**: Admin Account Rejected - Trash2Action
- **Content**: Rejection notification
- **Sent**: When admin rejects the request

### 4. Email Verification (BARANGAY/POSO)
- **Subject**: Verify Your Email - Trash2Action
- **Content**: Standard verification link
- **Sent**: Immediately after BARANGAY/POSO registration

## Login Behavior

### ADMIN Account
1. **Pending Approval**: Cannot login, shows pending message
2. **Rejected**: Cannot login, shows rejection message
3. **Approved**: Can login immediately (no email verification check)

### BARANGAY/POSO Account
1. **Not verified**: Cannot login, shows verification needed
2. **Verified**: Can login normally

## Key Differences

| Feature | ADMIN | BARANGAY/POSO |
|---------|-------|---------------|
| Button Text | "Request Account" | "Create Account" |
| Email Verification | Not required (pre-verified) | Required |
| Approval Required | Yes | No (auto-approved) |
| Can Login After Registration | No (needs approval) | No (needs email verification) |
| Position Field | Hidden (auto-set to "Administrator") | Required |
| Employee ID | Must be unique | Must be unique |

## Frontend Changes

### ResponderRegister.js
- Shows different success messages based on account type
- ADMIN: "Request Submitted" screen (no resend button)
- BARANGAY/POSO: "Check Your Email" screen (with resend button)
- Dynamic note text based on selected account type
- Button text: "Request Account" for ADMIN, "Create Account" for others

### ResponderLogin.js
- Handles `needsApproval` error response
- Shows appropriate message for pending/rejected accounts
- Email verification check only for BARANGAY/POSO accounts

## Admin Dashboard Integration

The AdminDashboard will need to implement:

1. **Pending Requests Tab**
   - List all pending admin requests
   - Show requester details
   - Approve/Reject buttons

2. **Approval Action**
   - Call `/api/responder/approve-admin` endpoint
   - Show confirmation dialog
   - Refresh list after action

3. **Request Details**
   - Full name
   - Employee ID
   - Email
   - Phone
   - Barangay
   - Request date
   - Current status

## Security Considerations

1. **Password Security**
   - Passwords are hashed even for pending accounts
   - No plaintext passwords stored

2. **Email Verification**
   - Required for BARANGAY/POSO only
   - ADMIN accounts are pre-verified
   - Tokens expire in 1 hour for BARANGAY/POSO

3. **Approval Process**
   - Only existing admins can approve requests
   - Approval requires authentication
   - Actions are logged

4. **Employee ID Uniqueness**
   - Employee IDs must be unique across all responders
   - Checked during registration

## Testing

### Test ADMIN Registration
1. Register with account type "ADMIN"
2. Check email for submission confirmation
3. Try to login (should fail with pending message)
4. Admin approves request
5. Check email for approval notification
6. Login successfully (no email verification needed)

### Test BARANGAY/POSO Registration
1. Register with account type "BARANGAY" or "POSO"
2. Check email for verification link
3. Click verification link
4. Login successfully

### Test Rejection
1. Register as ADMIN
2. Admin rejects request
3. Check email for rejection notification
4. Try to login (should fail with rejection message)

### Test Employee ID Uniqueness
1. Register with an employee ID
2. Try to register again with same employee ID
3. Should fail with "Employee ID already registered" error

## Next Steps

1. Implement pending requests UI in AdminDashboard
2. Add approval/rejection functionality
3. Add filtering and search for requests
4. Add audit log for approval actions
5. Add notification system for admins when new requests arrive
