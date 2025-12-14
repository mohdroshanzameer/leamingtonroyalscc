# Cricket Club - Local Deployment System

Industry-standard, modular batch script system for deploying the Cricket Club application locally.

## 🚀 Quick Start

1. **Edit Configuration**
   ```
   Edit config.bat and set your database credentials and paths
   ```

2. **Run Main Menu**
   ```
   Double-click: main-menu.bat
   ```

3. **Choose Full Setup (Option 9)**
   - Checks prerequisites
   - Cleans installation
   - Sets up database
   - Gets code
   - Configures backend & frontend
   - Creates start scripts

4. **Start Application**
   ```
   Option S from main menu
   OR
   Run: start-servers.bat
   ```

## 📁 Structure

```
local-deployment/
├── config.bat                  # Central configuration
├── main-menu.bat              # Interactive menu
├── full-setup.bat             # Automated full setup
├── start-servers.bat          # Start application
├── tasks/
│   ├── 01-check-prerequisites.bat
│   ├── 02-clean-install.bat
│   ├── 03-export-data.bat
│   ├── 04-setup-database.bat
│   ├── 05-get-code.bat
│   ├── 06-setup-backend.bat
│   ├── 07-setup-frontend.bat
│   └── 08-create-start-scripts.bat
└── README.md
```

## ⚙️ Configuration

Edit `config.bat` before running:

- **Database**: Name, user, password, host, port
- **Ports**: Backend (5000), Frontend (3000)
- **Paths**: Installation directory
- **Code Source**: GitHub URL or local path

## 📋 Prerequisites

- Node.js (v16+)
- npm
- PostgreSQL (v12+)
- Git (optional, for GitHub clone)

## 🎯 Individual Tasks

Run tasks separately through the main menu:

1. **Check Prerequisites** - Verify installed software
2. **Clean Install** - Remove existing installation
3. **Export Data** - Backup production database
4. **Setup Database** - Create local PostgreSQL database
5. **Get Code** - Clone from GitHub or copy local
6. **Setup Backend** - Configure Express.js API
7. **Setup Frontend** - Configure React app
8. **Create Start Scripts** - Generate launcher scripts

## 🔧 Troubleshooting

### Database Connection Failed
- Verify PostgreSQL is running
- Check credentials in `config.bat`
- Ensure port 5432 is not blocked

### npm install Failed
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and retry
- Check internet connection

### Port Already in Use
- Change ports in `config.bat`
- Kill existing processes on those ports

## 📝 Notes

- Run as Administrator for database setup
- Backend must start before frontend
- Default admin credentials created during database setup
- Data export is optional but recommended for migration

## 🆘 Support

For issues or questions:
1. Check the README in parent directories
2. Review error messages in console
3. Verify all prerequisites are installed
4. Ensure config.bat values are correct