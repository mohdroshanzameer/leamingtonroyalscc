# Setup Scripts Guide

## Overview

The setup scripts have been reorganized into a modular, industry-standard structure. Each script handles a specific task and can be run independently or via the master setup menu.

## Script Organization

```
components/docs/setup/
├── master-setup.bat           # Main menu - run this first
├── full-setup.bat             # Automated full setup
├── check-prerequisites.bat    # Verify system requirements
├── setup-database.bat         # PostgreSQL setup
├── setup-backend.bat          # Express.js backend
├── setup-frontend.bat         # React frontend
├── install-dependencies.bat   # npm install for all
├── create-admin-user.bat      # Add admin users
├── start-services.bat         # Start both services
├── start-backend.bat          # Start backend only
├── start-frontend.bat         # Start frontend only
└── README.md                  # Detailed documentation
```

## Usage

### For First-Time Setup

**Interactive Approach (Recommended):**
```bash
cd components/docs/setup
master-setup.bat
```
Then select option `10` for full setup, or run steps individually.

**Automated Approach:**
```bash
cd components/docs/setup
full-setup.bat
```
This runs all steps automatically without prompts.

### For Daily Development

**Start Everything:**
```bash
cd components/docs/setup
start-services.bat
```

**Or start individually:**
```bash
start-backend.bat   # Terminal 1
start-frontend.bat  # Terminal 2
```

## Script Details

### 1. master-setup.bat
Interactive menu with 11 options:
- Individual setup tasks (1-6)
- Service management (7-9)
- Full automated setup (10)
- Exit (0)

### 2. check-prerequisites.bat
Verifies:
- Node.js installation and version
- npm availability
- PostgreSQL installation
- Git (optional)

Returns success/failure status for automation.

### 3. setup-database.bat
- Creates PostgreSQL database
- Creates database user with permissions
- Applies schema from DATABASE_SCHEMA.sql
- Configurable database name, user, password

### 4. setup-backend.bat
- Creates backend directory structure
- Initializes npm project
- Installs Express, pg, cors, dotenv, etc.
- Creates server.js with REST API
- Generates .env file

### 5. setup-frontend.bat
- Creates React application (if not exists)
- Installs React Query, React Router, Axios
- Creates .env for API configuration
- Sets up API client wrapper

### 6. install-dependencies.bat
- Runs `npm install` in backend folder
- Runs `npm install` in frontend folder
- Useful for clean reinstalls

### 7. create-admin-user.bat
- Prompts for admin email and name
- Creates user in database
- Sets role to 'super_admin'
- Can be run multiple times

### 8-10. Service Start Scripts
- **start-services.bat**: Launches both in separate windows
- **start-backend.bat**: Backend only
- **start-frontend.bat**: Frontend only

## Best Practices

### Script Modularity Benefits
✅ **Independent execution** - Run only what you need
✅ **Easier debugging** - Isolate issues to specific tasks
✅ **Reusability** - Re-run database setup without frontend rebuild
✅ **Maintainability** - Edit one script without affecting others
✅ **CI/CD friendly** - Can be used in automation pipelines

### Recommended Workflow

**First Time:**
```
master-setup.bat → Option 10 (Full Setup)
```

**After Reboot:**
```
start-services.bat
```

**Resetting Database:**
```
master-setup.bat → Option 2 (Setup Database)
```

**Adding Users:**
```
master-setup.bat → Option 6 (Create Admin User)
```

## Industry Standards Followed

1. **Single Responsibility** - Each script does one thing well
2. **Idempotent Operations** - Scripts can be safely re-run
3. **Error Handling** - Proper exit codes and error messages
4. **User Feedback** - Clear progress indicators
5. **Configuration Separation** - Environment variables in .env
6. **Graceful Failures** - Continue when possible, fail fast when necessary
7. **Documentation** - Comprehensive inline comments
8. **Logging** - Clear output for debugging

## Environment Variables

All sensitive configuration is stored in `.env` files:

**Backend .env:**
```env
DB_USER=cricket_admin
DB_PASSWORD=CricketClub2025!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cricket_club_db
PORT=5000
JWT_SECRET=your_secret_here
```

**Frontend .env:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## Customization

To change default settings, edit variables at the top of each script:

```batch
set "DB_NAME=cricket_club_db"      # Database name
set "DB_USER=cricket_admin"        # Database user
set "DB_PASSWORD=CricketClub2025!" # Database password
set "BACKEND_PORT=5000"            # Backend port
set "FRONTEND_PORT=3000"           # Frontend port
```

## Troubleshooting

### Common Issues

**"Command not found" errors:**
- Ensure tools are in PATH environment variable
- Restart command prompt after installing software

**Database connection errors:**
- Verify PostgreSQL service is running
- Check credentials in .env
- Ensure port 5432 is not blocked

**Port conflicts:**
- Change PORT in .env files
- Kill process using the port: `netstat -ano | findstr :5000`

**Permission errors:**
- Run scripts as Administrator
- Check PostgreSQL user permissions

## Migration from Old Script

If you were using the old monolithic setup script:

**Old:**
```bash
setup-windows.bat  # One large script
```

**New:**
```bash
master-setup.bat   # Interactive menu
# or
full-setup.bat     # Automated (same result)
```

All functionality is preserved, just better organized!

---

**Version:** 2.0 (Modular)
**Last Updated:** December 2024