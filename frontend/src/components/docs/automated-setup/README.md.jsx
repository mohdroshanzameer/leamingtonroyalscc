# Automated Setup System

## Overview
Complete modular automated setup system for the Cricket Club application. All configuration is centralized in `config.bat` to avoid hardcoding.

## Quick Start

### Option 1: Full Automated Setup (Recommended)
1. Edit `config.bat` with your GitHub URL and settings
2. Run `main-menu.bat`
3. Select option `[9] FULL AUTO-SETUP`
4. Confirm and wait for completion

### Option 2: Step-by-Step Setup
1. Edit `config.bat` with your settings
2. Run `main-menu.bat`
3. Select individual tasks in order (1-6)

## Configuration

All settings are in `config.bat`:

```batch
# GitHub Repository
GITHUB_REPO_URL=https://github.com/yourusername/cricket-club.git

# Database
DB_NAME=cricket_club_db
DB_USER=cricket_admin
DB_PASSWORD=YourSecurePassword

# Ports
BACKEND_PORT=5000
FRONTEND_PORT=3000

# Admin User
ADMIN_EMAIL=admin@cricketclub.com
ADMIN_PASSWORD=Admin@123
```

## Scripts

### Main Scripts
- **main-menu.bat** - Interactive menu for all tasks
- **full-auto-setup.bat** - Complete automated setup (all steps)
- **config.bat** - Central configuration file

### Task Scripts
1. **clone-from-github.bat** - Clone project from GitHub
2. **setup-database.bat** - Create database, user, and apply schema
3. **setup-backend.bat** - Setup backend server and .env
4. **setup-frontend.bat** - Setup frontend application and .env
5. **install-dependencies.bat** - Install all npm dependencies
6. **build-and-start.bat** - Build and start both backend and frontend

## Prerequisites

Before running, ensure you have:
- Node.js (v14+)
- npm or yarn
- PostgreSQL (v12+)
- Git

## What Gets Automated

✅ Clone repository from GitHub  
✅ Create PostgreSQL database and user  
✅ Apply database schema  
✅ Create admin user  
✅ Setup backend with .env file  
✅ Setup frontend with .env file  
✅ Install all dependencies  
✅ Build React application  
✅ Start backend server  
✅ Start frontend development server  

## After Setup

The application will be running at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

Login with the admin credentials from `config.bat`.

## Troubleshooting

### PostgreSQL Connection Issues
- Verify PostgreSQL is running
- Check DB_HOST, DB_PORT in config.bat
- Ensure superuser password is correct

### npm Install Failures
- Clear node_modules and try again
- Check internet connection
- Try using yarn instead (set PKG_MANAGER=yarn)

### Port Already in Use
- Change BACKEND_PORT or FRONTEND_PORT in config.bat
- Kill existing processes on those ports

## Directory Structure

```
automated-setup/
├── config.bat                  # Central configuration
├── main-menu.bat              # Main menu
├── full-auto-setup.bat        # Full automation
├── clone-from-github.bat      # Task 1
├── setup-database.bat         # Task 2
├── setup-backend.bat          # Task 3
├── setup-frontend.bat         # Task 4
├── install-dependencies.bat   # Task 5
├── build-and-start.bat        # Task 6
└── README.md                  # This file
```

## Customization

To customize the setup:
1. Edit `config.bat` for basic settings
2. Modify individual task scripts for advanced customization
3. All scripts read from config.bat automatically

## Support

For issues or questions, refer to the main project documentation.