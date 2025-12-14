# Cricket Club Management System - Modular Setup Scripts

## Overview

This folder contains modular Windows batch scripts for setting up the Cricket Club Management System. Each script handles a specific task, and they can be run independently or via the master menu.

## Quick Start

### Option 1: Interactive Menu (Recommended)
```bash
master-setup.bat
```
This displays a menu where you can choose which setup tasks to run.

### Option 2: Full Automated Setup
```bash
full-setup.bat
```
Runs all setup steps in sequence automatically.

### Option 3: Run Individual Scripts
Run scripts in this order for manual setup:
```bash
1. check-prerequisites.bat
2. setup-database.bat
3. setup-backend.bat
4. setup-frontend.bat
5. install-dependencies.bat
6. create-admin-user.bat
7. start-services.bat
```

## Script Descriptions

### Master Scripts
- **master-setup.bat** - Interactive menu for all setup tasks
- **full-setup.bat** - Automated full setup (all steps)

### Setup Scripts
- **check-prerequisites.bat** - Verify Node.js, npm, PostgreSQL are installed
- **setup-database.bat** - Create PostgreSQL database and schema
- **setup-backend.bat** - Create Express.js backend server
- **setup-frontend.bat** - Create React frontend application
- **install-dependencies.bat** - Install all npm packages
- **create-admin-user.bat** - Add admin user to database

### Runtime Scripts
- **start-services.bat** - Start both backend and frontend
- **start-backend.bat** - Start backend server only
- **start-frontend.bat** - Start frontend application only

## Prerequisites

Before running any script, ensure you have:
- **Node.js** (v18+) - https://nodejs.org/
- **PostgreSQL** (v14+) - https://www.postgresql.org/download/windows/
- **Git** (optional) - https://git-scm.com/download/windows

## Configuration

Default settings (can be modified in each script):
```
Database:
  - Name: cricket_club_db
  - User: cricket_admin
  - Password: CricketClub2025!
  - Host: localhost
  - Port: 5432

Backend:
  - Port: 5000
  - API: http://localhost:5000/api

Frontend:
  - Port: 3000
  - UI: http://localhost:3000
```

## Troubleshooting

### "Access Denied" errors
- Right-click the script and select "Run as Administrator"

### "psql: command not found"
- Add PostgreSQL bin directory to PATH environment variable
- Default location: `C:\Program Files\PostgreSQL\15\bin`

### "Port already in use"
- Change PORT value in the respective .env file
- Or kill the process using that port

### Script hangs or freezes
- Press `Ctrl+C` to cancel
- Check for password prompts that may be hidden

## Advanced Usage

### Resetting the Database
```bash
setup-database.bat
```
This will drop and recreate the database (data will be lost).

### Reinstalling Dependencies
```bash
install-dependencies.bat
```
Runs `npm install` in both backend and frontend.

### Creating Additional Admin Users
```bash
create-admin-user.bat
```
Can be run multiple times to add more admins.

## File Structure After Setup

```
cricket-club-app/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   └── node_modules/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env
│   ├── package.json
│   └── node_modules/
└── (these setup scripts)
```

## Support

For issues:
1. Check script error messages
2. Verify prerequisites are installed
3. Ensure PostgreSQL service is running
4. Check database credentials in .env files

## Best Practices

✅ **Do:**
- Run `check-prerequisites.bat` first
- Keep the setup scripts in a dedicated folder
- Back up your database before re-running `setup-database.bat`
- Use the master menu for ease of use

❌ **Don't:**
- Edit scripts while they're running
- Delete scripts while services are running
- Share your .env files (contain sensitive credentials)

---

**Version:** 1.0
**Last Updated:** December 2024