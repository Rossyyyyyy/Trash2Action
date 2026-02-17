# Testing Admin Approval Flow

## Test Scenario 1: ADMIN Account Registration and Approval

### Step 1: Register ADMIN Account
1. Open app and navigate to Responder Registration
2. Fill in the form:
   - Full Name: "Test Admin"
   - Account Type: Select "ADMIN"
   - Employee ID: "ADMIN001"
   - Email: "testadmin@example.com"
   - Phone: "09123456789"
   - Barangay: "Barangay 1"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Request Account" button
4. Should see success message: "Admin account request submitted!"

**Expected Database State:**
```javascript
{
  fullName: "Test Admin",
  accountType: "ADMIN",
  employeeId: "ADMIN001",
  email: "testadmin@example.com",
  isEmailVerified: true,  // Pre-verified
  isApproved: false,      // Needs approval
  approvalStatus: "pending"
}
```

### Step 2: Try to Login (Should Fail)
1. Navigate to Responder Login
2. Enter:
   - Employee ID: "ADMIN001"
   - Account Type: "ADMIN"
   - Password: "password123"
3. Click "Login"
4. Should see error: "Your admin account request is pending approval..."

### Step 3: Approve the Request
1. Login as existing admin
2. Navigate to AdminDashboard → Responders tab
3. Click "Admin Account Requests" button
4. Should see "Test Admin" in the pending list
5. Click "Approve" button
6. Confirm approval
7. Should see success message

**Expected Database State After Approval:**
```javascript
{
  fullName: "Test Admin",
  accountType: "ADMIN",
  employeeId: "ADMIN001",
  email: "testadmin@example.com",
  isEmailVerified: true,
  isApproved: true,        // ✓ Approved
  approvalStatus: "approved" // ✓ Status updated
}
```

### Step 4: Login Successfully
1. Navigate to Responder Login
2. Enter:
   - Employee ID: "ADMIN001"
   - Account Type: "ADMIN"
   - Password: "password123"
3. Click "Login"
4. **Should login successfully** ✓
5. Should navigate to AdminDashboard

## Test Scenario 2: ADMIN Account Rejection

### Step 1: Register Another ADMIN Account
1. Register with:
   - Employee ID: "ADMIN002"
   - Email: "testadmin2@example.com"
   - Other details as needed

### Step 2: Reject the Request
1. Login as existing admin
2. Navigate to pending requests
3. Click "Reject" button for ADMIN002
4. Confirm rejection

**Expected Database State:**
```javascript
{
  isApproved: false,
  approvalStatus: "rejected"
}
```

### Step 3: Try to Login (Should Fail)
1. Try to login with ADMIN002 credentials
2. Should see error: "Your admin account request has been rejected..."

## Test Scenario 3: BARANGAY Account (Auto-Approved)

### Step 1: Register BARANGAY Account
1. Register with:
   - Account Type: "BARANGAY"
   - Position: "Field Officer"
   - Employee ID: "BRNGY001"
   - Email: "barangay@example.com"

**Expected Database State:**
```javascript
{
  accountType: "BARANGAY",
  isEmailVerified: false,  // Needs verification
  isApproved: true,        // Auto-approved
  approvalStatus: "approved"
}
```

### Step 2: Verify Email
1. Check email for verification link
2. Click verification link
3. Email should be verified

### Step 3: Login Successfully
1. Login with BARANGAY credentials
2. Should login successfully ✓

## Verification Checklist

### ADMIN Account Login Requirements
- ✓ `accountType === "ADMIN"`
- ✓ `isApproved === true`
- ✓ `approvalStatus === "approved"`
- ✓ Valid password
- ✗ Email verification NOT required

### BARANGAY/POSO Account Login Requirements
- ✓ `accountType === "BARANGAY"` or `"POSO"`
- ✓ `isEmailVerified === true`
- ✓ Valid password
- ✗ Approval NOT required (auto-approved)

## Common Issues and Solutions

### Issue: ADMIN can't login after approval
**Check:**
1. Database: `isApproved` should be `true`
2. Database: `approvalStatus` should be `"approved"`
3. Backend logs for any errors
4. Correct employee ID and password

**Solution:**
```javascript
// Manually update in MongoDB if needed
db.responders.updateOne(
  { employeeId: "ADMIN001" },
  { 
    $set: { 
      isApproved: true, 
      approvalStatus: "approved" 
    } 
  }
)
```

### Issue: Approval email not received
**Check:**
1. Backend .env has correct email credentials
2. Backend console for email sending errors
3. Spam/junk folder
4. Email address is correct

### Issue: Request not showing in pending list
**Check:**
1. Account type is "ADMIN"
2. `approvalStatus` is "pending"
3. `isApproved` is `false`
4. Backend endpoint `/api/responder/pending-requests` is working

## API Testing with Postman/Thunder Client

### Get Pending Requests
```
GET http://YOUR_IP:5000/api/responder/pending-requests
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Approve Request
```
POST http://YOUR_IP:5000/api/responder/approve-admin
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
  Content-Type: application/json
Body:
{
  "responderId": "RESPONDER_ID_FROM_DATABASE",
  "approved": true
}
```

### Login as ADMIN
```
POST http://YOUR_IP:5000/api/responder/login
Headers:
  Content-Type: application/json
Body:
{
  "employeeId": "ADMIN001",
  "accountType": "ADMIN",
  "password": "password123"
}
```

## Expected Login Response (Success)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "responder": {
    "id": "...",
    "fullName": "Test Admin",
    "accountType": "ADMIN",
    "employeeId": "ADMIN001",
    "email": "testadmin@example.com",
    "phone": "09123456789",
    "barangay": "Barangay 1",
    "position": "Administrator",
    "isEmailVerified": true,
    "isApproved": true
  }
}
```

## Database Query Examples

### Check ADMIN account status
```javascript
db.responders.findOne({ employeeId: "ADMIN001" })
```

### Find all pending ADMIN requests
```javascript
db.responders.find({ 
  accountType: "ADMIN", 
  approvalStatus: "pending" 
})
```

### Manually approve an ADMIN account
```javascript
db.responders.updateOne(
  { employeeId: "ADMIN001" },
  { 
    $set: { 
      isApproved: true, 
      approvalStatus: "approved" 
    } 
  }
)
```
