# Complete Self-Hosting Setup Guide

This guide will help you run the Leamington Royals Cricket Club app on your own laptop.

---

## **OVERVIEW: What You're Setting Up**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Your Browser   │────▶│  Backend API    │────▶│  Supabase DB    │
│  (Frontend)     │     │  (localhost:    │     │  (PostgreSQL)   │
│  localhost:5173 │◀────│   3001)         │◀────│                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      React App           Node.js Server         Cloud Database
```

---

## **STEP 1: Install Required Software**

### 1.1 Install Node.js (Required)
Node.js runs JavaScript on your computer (needed for both frontend and backend).

**Windows:**
1. Go to https://nodejs.org
2. Click the big green **LTS** button (e.g., "20.x LTS")
3. Run the downloaded `.msi` file
4. Click Next → Next → Next → Install → Finish

**Mac:**
1. Go to https://nodejs.org
2. Click the big green **LTS** button
3. Run the downloaded `.pkg` file
4. Follow the installer

**Verify Installation:**
Open Terminal (Mac) or Command Prompt (Windows) and type:
```bash
node --version
npm --version
```
You should see version numbers like `v20.10.0` and `10.2.0`.

---

### 1.2 Install Git (Recommended)
Git is for version control (optional but useful).

**Windows:**
1. Go to https://git-scm.com/download/windows
2. Download and run the installer
3. Click Next through all options (defaults are fine)

**Mac:**
Git is usually pre-installed. Open Terminal and type:
```bash
git --version
```
If not installed, it will prompt you to install Xcode Command Line Tools.

---

### 1.3 Install a Code Editor (Recommended)
**VS Code** is the most popular free editor.
1. Go to https://code.visualstudio.com
2. Download and install for your OS

---

## **STEP 2: Set Up Supabase (Free Database)**

1. Go to https://supabase.com
2. Click "Start your project" and sign up (use GitHub login, it's easiest)
3. Click "New Project"
4. Fill in:
   - **Name**: `leamington-royals`
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
5. Click "Create new project" and wait 2 minutes

### Get Your Supabase Credentials
Once project is ready:
1. Click **Settings** (gear icon) → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (another long string - keep secret!)

---

## **STEP 3: Create Database Tables**

1. In Supabase, click **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy and paste the entire contents of `DATABASE_SCHEMA.sql` (in same folder)
4. Click "Run"

---

## **STEP 4: Set Up Backend Server**

### 4.1 Create Project Folder

**Windows (Command Prompt):**
```cmd
cd %USERPROFILE%\Desktop
mkdir leamington-royals-backend
cd leamington-royals-backend
```

**Mac (Terminal):**
```bash
cd ~/Desktop
mkdir leamington-royals-backend
cd leamington-royals-backend
```

### 4.2 Initialize Node.js Project
```bash
npm init -y
```
This creates a `package.json` file.

### 4.3 Install Required Packages
```bash
npm install express cors dotenv @supabase/supabase-js multer uuid jsonwebtoken bcryptjs
```
Wait for it to finish (may take 1-2 minutes).

### 4.4 Create server.js File

**Option A: Using VS Code**
1. Open VS Code
2. File → Open Folder → Select `leamington-royals-backend`
3. Right-click in the file explorer → New File → name it `server.js`
4. Copy the ENTIRE contents of `BACKEND_SERVER.js` and paste

**Option B: Using Terminal/Command Line**
```bash
# Mac/Linux
touch server.js

# Windows (PowerShell)
New-Item server.js
```
Then open in any text editor and paste the content.

### 4.5 Create .env File

Create a file named `.env` (just dot-env, no name before the dot):

```env
# Supabase - Get from: Supabase Dashboard → Settings → API
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# JWT Secret - Make this a random string (at least 32 characters)
JWT_SECRET=my-super-secret-key-change-this-to-something-random-12345

# Port
PORT=3001
```

⚠️ **IMPORTANT:** Replace the placeholder values with your actual Supabase credentials!

### 4.6 Start the Backend Server
```bash
node server.js
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║   🏏 Leamington Royals Backend Server                  ║
║   Server running on: http://localhost:3001             ║
╚════════════════════════════════════════════════════════╝
```

**Keep this terminal window open!** The server needs to keep running.

---

## **STEP 5: Set Up Frontend**

### 5.1 Export from Base44
1. Log into Base44
2. Go to your project
3. Click **Settings** (gear icon) → **Export**
4. Download the ZIP file
5. Extract/Unzip to `Desktop/leamington-royals-frontend`

### 5.2 Open a NEW Terminal Window
Don't close the backend terminal! Open a second one.

**Windows:** Press `Win + R`, type `cmd`, press Enter
**Mac:** Press `Cmd + Space`, type `Terminal`, press Enter

### 5.3 Navigate to Frontend Folder
```bash
# Windows
cd %USERPROFILE%\Desktop\leamington-royals-frontend

# Mac
cd ~/Desktop/leamington-royals-frontend
```

### 5.4 Create Frontend .env File
Create a `.env` file in the frontend folder:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

### 5.5 Install Frontend Dependencies
```bash
npm install
```
This may take 2-5 minutes.

### 5.6 Start the Frontend
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### 5.7 Open in Browser
Open your web browser and go to: **http://localhost:5173**

🎉 **Your app should now be running!**

---

## **STEP 6: Test Everything**

### Checklist:
- [ ] Backend terminal shows "Server running on http://localhost:3001"
- [ ] Frontend terminal shows "Local: http://localhost:5173"
- [ ] Browser opens http://localhost:5173 without errors
- [ ] You can see the homepage

### Quick API Test:
Open a new browser tab and go to:
```
http://localhost:3001/api/health
```
You should see: `{"status":"ok","timestamp":"..."}`

---

## **STEP 7: Create Your First User**

Since this is a fresh database, you need to add a user:

1. Go to Supabase Dashboard → Table Editor
2. Select the `users` table
3. Click "Insert" → "Insert row"
4. Fill in:
   - `email`: your-email@example.com
   - `full_name`: Your Name
   - `role`: admin
   - `club_role`: super_admin
5. Click "Save"

Now you can log in with this email!

---

## **Folder Structure After Setup**
```
Desktop/
├── leamington-royals-backend/
│   ├── node_modules/        (auto-created)
│   ├── server.js            (you created)
│   ├── .env                 (you created - secret!)
│   ├── package.json         (auto-created)
│   └── package-lock.json    (auto-created)
│
└── leamington-royals-frontend/
    ├── node_modules/        (auto-created)
    ├── src/                 (your React code)
    ├── .env                 (you created)
    ├── package.json
    ├── vite.config.js
    └── index.html
```

---

## **Common Issues & Fixes**

### ❌ "Cannot connect to database"
**Cause:** Wrong Supabase credentials
**Fix:** 
1. Go to Supabase → Settings → API
2. Copy the correct URL and keys
3. Paste into your `.env` file
4. Restart the backend: `Ctrl+C` then `node server.js`

### ❌ "CORS error" in browser console
**Cause:** Backend not running or wrong URL
**Fix:**
1. Make sure backend terminal is still running
2. Check frontend `.env` has `VITE_API_URL=http://localhost:3001/api`
3. Restart frontend: `Ctrl+C` then `npm run dev`

### ❌ "Port 3001 already in use"
**Cause:** Another program using port 3001
**Fix Option 1:** Kill the process using that port:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Mac
lsof -i :3001
kill -9 <PID_NUMBER>
```
**Fix Option 2:** Change port in backend `.env`:
```env
PORT=3002
```
Then update frontend `.env`:
```env
VITE_API_URL=http://localhost:3002/api
```

### ❌ "Module not found" error
**Cause:** Missing dependencies
**Fix:** Run `npm install` again in the folder with the error

### ❌ "node: command not found"
**Cause:** Node.js not installed or not in PATH
**Fix:** Reinstall Node.js from https://nodejs.org

### ❌ Blank page in browser
**Cause:** JavaScript error
**Fix:** 
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for red errors
4. Usually it's a missing environment variable

---

## **How to Start Again (After Reboot)**

Every time you restart your computer, you need to start both servers:

**Terminal 1 (Backend):**
```bash
cd Desktop/leamington-royals-backend
node server.js
```

**Terminal 2 (Frontend):**
```bash
cd Desktop/leamington-royals-frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

---

## **Quick Reference: All Commands**

| Task | Command |
|------|---------|
| Start backend | `node server.js` |
| Start frontend | `npm run dev` |
| Stop any server | `Ctrl + C` |
| Install packages | `npm install` |
| Check Node version | `node --version` |

---

## **Next Steps: Deploy to the Internet**

Once working locally, you can deploy so others can access:

| Component | Free Hosting Options |
|-----------|---------------------|
| Backend | Railway, Render, Fly.io |
| Frontend | Vercel, Netlify, Cloudflare Pages |
| Database | Keep Supabase (free tier = 500MB) |

I can provide deployment guides if needed!