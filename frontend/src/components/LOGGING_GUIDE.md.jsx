# Logging & Error Tracking Guide

## Overview
The application now has comprehensive error handling and logging capabilities to help diagnose issues in production environments.

---

## 1. Accessing Error Logs via UI

### Step 1: Navigate to Error Logs Page
- **URL**: `https://yourdomain.com/ErrorLogs` or `/ErrorLogs`
- This page is accessible to all users (including admins)

### Step 2: View Logs
The page has two tabs:
- **Errors Tab**: Shows all caught errors with full context
- **Application Logs Tab**: Shows debug, info, warn, and error logs

### Step 3: Export Logs
- Click **"Export JSON"** button to download logs as a file
- Send this file when reporting issues

### Step 4: Clear Logs
- Click **"Clear All"** to remove logs from browser storage
- Useful for starting fresh debugging sessions

---

## 2. Browser Console Logs

### Viewing Console Logs
1. **Open Browser Developer Tools**:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - **Safari**: Press `Cmd+Option+C`

2. **Go to Console Tab**

3. **Look for Log Entries**:
   ```
   [INFO][SignIn] Login attempt { email: "user@example.com" }
   [ERROR][APIClient] API Error: /auth/login { status: 401, duration: 234 }
   === ERROR LOG ===
   Time: 2025-01-15T10:30:45.123Z
   Message: Network error - unable to connect to server
   Context: {...}
   ================
   ```

### Console Log Format
- `[LEVEL][CATEGORY]` Message, Data
- **Levels**: DEBUG, INFO, WARN, ERROR
- **Categories**: SignIn, Register, APIClient, Layout, etc.

---

## 3. Where Logs Are Stored

### Session Storage
All logs are stored in the browser's Session Storage:

**To view manually**:
1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Session Storage**
4. Look for:
   - `error_logs` - Error logs
   - `app_logs` - Application logs

**Storage Limits**:
- Last 50 error logs are kept
- Last 100 application logs are kept
- Older logs are automatically removed

---

## 4. Log Structure

### Error Log Entry
```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "message": "Network error - unable to connect to server",
  "stack": "Error: Network error...\n    at request (apiClient.js:45:12)",
  "context": {
    "url": "https://yourdomain.com/SignIn",
    "userAgent": "Mozilla/5.0...",
    "type": "NETWORK_ERROR",
    "endpoint": "/auth/login",
    "status": null,
    "duration": 234,
    "category": "network",
    "severity": "high"
  }
}
```

### Application Log Entry
```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "INFO",
  "category": "SignIn",
  "message": "Login attempt",
  "data": {
    "email": "user@example.com"
  },
  "url": "https://yourdomain.com/SignIn",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 5. Log Categories

### Error Categories
- **network**: Connection/fetch errors
- **authentication**: Auth/login errors
- **validation**: Input validation errors
- **permission**: Access denied errors
- **database**: Database operation errors
- **business_logic**: Business rule violations
- **unknown**: Uncategorized errors

### Application Log Categories
- **SignIn**: Login page activities
- **Register**: Registration page activities
- **APIClient**: API request/response tracking
- **Layout**: App layout and navigation
- *More categories added as needed*

---

## 6. How to Report Issues

### When Reporting a Bug:

1. **Export Error Logs**:
   - Go to `/ErrorLogs` page
   - Click **"Export JSON"** on Errors tab
   - Save the file (e.g., `error-logs-2025-01-15.json`)

2. **Export Application Logs**:
   - Switch to **"Application Logs"** tab
   - Click **"Export JSON"**
   - Save the file (e.g., `app-logs-2025-01-15.json`)

3. **Take Screenshots** (if applicable):
   - Screenshot of the error message
   - Screenshot of browser console

4. **Provide Context**:
   - What were you trying to do?
   - What page were you on?
   - What browser/device are you using?

5. **Send to Developer**:
   - Email the JSON files + screenshots
   - Include the context information

---

## 7. Real-Time Monitoring

### Live Console Monitoring
To see logs in real-time:
1. Open browser console (F12)
2. Perform actions in the app
3. Watch logs appear instantly

### Filter Console Logs
In Chrome DevTools Console:
- Filter by level: Click ERROR, WARN, INFO buttons
- Search: Type in the filter box (e.g., "SignIn", "network")
- Clear: Click the 🚫 icon

---

## 8. Common Log Patterns

### Successful Login
```
[INFO][SignIn] Login attempt { email: "user@example.com" }
[DEBUG][APIClient] API Request: POST /auth/login
[DEBUG][APIClient] API Success: /auth/login { status: 200, duration: 125 }
[INFO][SignIn] Login successful { email: "user@example.com" }
[INFO][SignIn] Token set, redirecting to Home
```

### Failed Login
```
[INFO][SignIn] Login attempt { email: "user@example.com" }
[DEBUG][APIClient] API Request: POST /auth/login
[ERROR][APIClient] API Error: /auth/login { status: 401, duration: 234 }
[WARN][SignIn] Login failed { email: "user@example.com", status: 401 }
=== ERROR LOG ===
Time: 2025-01-15T10:30:45.123Z
Message: Invalid email or password
Context: { type: "API_ERROR", endpoint: "/auth/login", status: 401 }
================
```

### Network Error
```
[INFO][SignIn] Login attempt { email: "user@example.com" }
[DEBUG][APIClient] API Request: POST /auth/login
[ERROR][APIClient] Network Error: /auth/login { originalError: "Failed to fetch" }
[ERROR][SignIn] Login error NetworkError { email: "user@example.com" }
=== ERROR LOG ===
Time: 2025-01-15T10:30:45.123Z
Message: Network error - unable to connect to server
Context: { type: "NETWORK_ERROR", category: "network" }
================
```

---

## 9. Troubleshooting

### No Logs Appearing
- Check if Session Storage is enabled in browser
- Try refreshing the page
- Check browser privacy settings (incognito mode clears session storage)

### Logs Disappeared
- Session Storage is cleared when tab/browser is closed
- Export logs before closing if needed

### Can't Export Logs
- Check if browser allows downloads
- Try right-click → "Save As" on download link
- Check browser download settings

---

## 10. Production Deployment Checklist

Before deploying to production:

✅ **Enable Logging**:
- Logs are automatically enabled
- Console logs work in all environments

✅ **Access ErrorLogs Page**:
- Ensure `/ErrorLogs` route is accessible
- Test log viewing and exporting

✅ **Test Error Scenarios**:
- Test network errors (disconnect internet)
- Test auth errors (wrong password)
- Verify logs are captured

✅ **Document for Users**:
- Tell admin users how to access `/ErrorLogs`
- Provide email/contact for sending log files

---

## 11. Quick Reference

### Access Logs
- **UI Page**: Navigate to `/ErrorLogs`
- **Browser Console**: Press F12 → Console tab
- **Session Storage**: F12 → Application → Session Storage

### Export Logs
- **From UI**: ErrorLogs page → Export JSON button
- **From Console**: `sessionStorage.getItem('error_logs')` or `sessionStorage.getItem('app_logs')`

### Clear Logs
- **From UI**: ErrorLogs page → Clear All button
- **From Console**: `sessionStorage.clear()`

### Important URLs
- **Error Logs Page**: `/ErrorLogs`
- **Your production domain**: `https://yourdomain.com/ErrorLogs`

---

## Support

When encountering issues:
1. Export logs from `/ErrorLogs` page
2. Take screenshots if applicable
3. Send logs + screenshots + description to developer
4. Include: Browser, OS, what you were trying to do

**Developer Contact**: [Your Email/Support Channel]