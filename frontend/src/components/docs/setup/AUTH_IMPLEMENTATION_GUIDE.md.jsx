# Local Authentication Implementation Guide

## Overview

Complete local authentication system with **bcrypt password hashing** for PostgreSQL database.

## 🔒 Security Features

✅ **bcrypt password hashing** (10 rounds by default)  
✅ **JWT token-based authentication**  
✅ **Audit logging** for all auth events  
✅ **Password validation** (min 8 characters)  
✅ **Failed login tracking**  
✅ **Account status management** (active/inactive/suspended)  
✅ **Secure password change** with current password verification  

## Files Created

### 1. Database Schema
**File:** `components/docs/setup/DATABASE_SCHEMA.sql`

**Features:**
- `users` table with `password_hash` column (bcrypt hashed)
- `refresh_tokens` table for JWT management
- `auth_audit_log` table for security tracking
- Indexes for performance
- Auto-update triggers

**User Table Structure:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hashed
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    last_login TIMESTAMP,
    created_date TIMESTAMP DEFAULT NOW()
);
```

### 2. Backend Server
**File:** `components/docs/backend/server-with-auth.js`

**Authentication Endpoints:**
- `POST /api/auth/register` - Register with password hashing
- `POST /api/auth/login` - Login with password verification
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/me` - Update profile (protected)
- `POST /api/auth/change-password` - Change password (protected)
- `POST /api/auth/logout` - Logout with audit log

**Password Hashing:**
```javascript
// Registration - Hash password
const password_hash = await bcrypt.hash(password, 10);

// Login - Verify password
const validPassword = await bcrypt.compare(password, user.password_hash);
```

### 3. Admin User Script
**File:** `components/docs/setup/create-admin-user-hashed.bat`

**Features:**
- Password validation (min 8 characters)
- Automatic bcrypt hashing using Node.js
- Secure admin creation
- Uses setup.config for database settings

## Setup Instructions

### Step 1: Apply Database Schema

```bash
cd components/docs/setup
psql -U postgres -d cricket_club_db -f DATABASE_SCHEMA.sql
```

Or use the batch script:
```bash
setup-database.bat
```

### Step 2: Install Dependencies

```bash
cd backend
npm install express pg cors bcryptjs jsonwebtoken multer uuid dotenv
```

### Step 3: Configure Environment

Update `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cricket_club_db
DB_USER=cricket_admin
DB_PASSWORD=YourPassword123

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Bcrypt
BCRYPT_ROUNDS=10

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Step 4: Start Backend Server

```bash
cd backend
cp ../components/docs/backend/server-with-auth.js server.js
node server.js
```

**Output:**
```
✅ Database connected
🚀 Server running on http://localhost:5000
📊 Environment: development
🔐 Auth: Local with bcrypt password hashing
```

### Step 5: Create Admin User

```bash
cd components/docs/setup
create-admin-user-hashed.bat
```

**Prompts:**
```
Enter admin email: admin@lrcc.com
Enter admin full name: Admin User
Enter admin password (min 8 chars): Admin123!
Enter database password: [your_db_password]
```

**Output:**
```
[SUCCESS] Admin user created!

Email:    admin@lrcc.com
Name:     Admin User
Role:     super_admin
Password: ******** (hashed with bcrypt)
```

## How Password Hashing Works

### Registration Flow

```
User submits password
        ↓
bcrypt.hash(password, 10)
        ↓
$2a$10$... (60-char hash)
        ↓
Store in database
```

**Example:**
```javascript
// Plain password: "Admin123!"
// Hashed: "$2a$10$rQ8N7ZxQxKxQxKxQxKxQxOeKxQxKxQxKxQxKxQxQxKxQxKxQxKxQx"
```

### Login Flow

```
User submits password
        ↓
Fetch user's password_hash
        ↓
bcrypt.compare(password, password_hash)
        ↓
Returns true/false
        ↓
Generate JWT if valid
```

### Password Change Flow

```
User submits current + new password
        ↓
Verify current password with bcrypt
        ↓
Hash new password
        ↓
Update password_hash in database
```

## Testing Authentication

### 1. Register New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lrcc.com",
    "password": "Test123!",
    "full_name": "Test User",
    "phone": "1234567890"
  }'
```

**Response:**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@lrcc.com",
    "full_name": "Test User",
    "role": "user"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lrcc.com",
    "password": "Admin123!"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@lrcc.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

### 3. Get Current User (Protected)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Change Password

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Admin123!",
    "new_password": "NewPassword123!"
  }'
```

## Security Audit Log

All authentication events are logged to `auth_audit_log` table:

```sql
SELECT * FROM auth_audit_log ORDER BY created_at DESC LIMIT 10;
```

**Logged Events:**
- `register` - User registration
- `login` - Successful login
- `failed_login` - Failed login attempts
- `logout` - User logout
- `password_change` - Password changes

**Example:**
```
| user_id | email          | action       | success | ip_address | created_at          |
|---------|----------------|--------------|---------|------------|---------------------|
| uuid    | admin@lrcc.com | login        | true    | 127.0.0.1  | 2025-12-09 10:30:00 |
| uuid    | test@lrcc.com  | failed_login | false   | 127.0.0.1  | 2025-12-09 10:29:00 |
```

## Password Requirements

Current validation:
- ✅ Minimum 8 characters
- ❌ No complexity requirements (add if needed)

### Add Password Complexity (Optional)

```javascript
function validatePassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain number';
  if (!/[!@#$%^&*]/.test(password)) return 'Password must contain special character';
  return null;
}
```

## Frontend Integration

Update `components/api/authApi.js`:

```javascript
// Register
async register(email, password, full_name, phone) {
  const response = await httpClient.post('/auth/register', {
    email, password, full_name, phone
  });
  this.setToken(response.token);
  return response.user;
}

// Login
async login(email, password) {
  const response = await httpClient.post('/auth/login', {
    email, password
  });
  this.setToken(response.token);
  return response.user;
}
```

## Common Issues

### "bcryptjs not installed"
**Solution:**
```bash
cd backend
npm install bcryptjs
```

### "Database connection failed"
**Solution:** Check `.env` database credentials and ensure PostgreSQL is running

### "Invalid or expired token"
**Solution:** Token expired or invalid JWT_SECRET - login again

### "Password must be at least 8 characters"
**Solution:** Use longer password during registration

## Migration from Supabase

If migrating from Supabase auth:

1. Export users from Supabase
2. For each user, generate bcrypt hash:
   ```javascript
   const hash = await bcrypt.hash(temporaryPassword, 10);
   ```
3. Insert into local users table
4. Send password reset emails to all users

## Production Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Increase `BCRYPT_ROUNDS` to 12
- [ ] Enable HTTPS
- [ ] Implement rate limiting for auth endpoints
- [ ] Add account lockout after failed attempts
- [ ] Implement password reset via email
- [ ] Add 2FA/MFA support
- [ ] Regular security audits via `auth_audit_log`

---

**✅ User passwords are now securely hashed with bcrypt and never stored in plain text.**