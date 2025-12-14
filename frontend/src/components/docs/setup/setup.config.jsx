REM ============================================================================
REM SETUP CONFIGURATION - All hardcoded values centralized here
REM ============================================================================
REM Edit this file to customize your installation
REM All setup scripts will read values from here

REM ============================================================================
REM PROJECT SETTINGS
REM ============================================================================
set "PROJECT_NAME=Cricket Club Management System"
set "PROJECT_SHORT_NAME=LRCC"
set "PROJECT_DIR=cricket-club-app"

REM ============================================================================
REM DATABASE SETTINGS
REM ============================================================================
set "DB_NAME=cricket_club_db"
set "DB_USER=cricket_admin"
set "DB_PASSWORD=CricketClub2025!"
set "DB_HOST=localhost"
set "DB_PORT=5432"

REM Database Password Encryption
set "DB_PASSWORD_ENCRYPTED=false"
set "DB_ENCRYPTION_KEY="

REM SQL Schema Files
set "SQL_SCHEMA_FILE=DATABASE_SCHEMA.sql"
set "SQL_SEED_FILE=database_seed.sql"

REM Connection Pool Settings
set "DB_POOL_MIN=2"
set "DB_POOL_MAX=10"
set "DB_IDLE_TIMEOUT=30000"
set "DB_CONNECTION_TIMEOUT=10000"

REM ============================================================================
REM BACKEND SERVER SETTINGS
REM ============================================================================
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "BACKEND_PORT=5000"
set "BACKEND_ENV=development"

REM JWT Configuration
set "JWT_SECRET=your_super_secret_jwt_key_change_this_in_production"
set "JWT_EXPIRATION=7d"

REM HTTPS Configuration
set "ENABLE_HTTPS=false"
set "HTTPS_PORT=443"
set "HTTPS_KEY_PATH=.\ssl\server.key"
set "HTTPS_CERT_PATH=.\ssl\server.crt"
set "HTTPS_REDIRECT_HTTP=true"

REM ============================================================================
REM FRONTEND SETTINGS
REM ============================================================================
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"
set "FRONTEND_PORT=3000"
set "FRONTEND_ENV=development"

REM ============================================================================
REM EXTERNAL SERVICES
REM ============================================================================
REM CI/CD
set "JENKINS_URL="
set "JENKINS_USER="
set "JENKINS_TOKEN="

REM Version Control
set "GIT_REPO_URL="
set "GIT_BRANCH=main"

REM Email/SMTP
set "SMTP_HOST=smtp.gmail.com"
set "SMTP_PORT=587"
set "SMTP_USER="
set "SMTP_PASSWORD="
set "SMTP_FROM=noreply@lrcc.com"

REM Cloud Storage
set "STORAGE_PROVIDER=local"
set "AWS_BUCKET="
set "AWS_REGION="
set "AWS_ACCESS_KEY="
set "AWS_SECRET_KEY="

REM Monitoring
set "MONITORING_URL="
set "MONITORING_API_KEY="

REM ============================================================================
REM SECURITY SETTINGS
REM ============================================================================
set "BCRYPT_ROUNDS=10"
set "SESSION_SECRET=your_session_secret_change_this"
set "CORS_ORIGIN=http://localhost:3000"
set "RATE_LIMIT_WINDOW=900000"
set "RATE_LIMIT_MAX_REQUESTS=100"

REM ============================================================================
REM FILE UPLOAD SETTINGS
REM ============================================================================
set "UPLOAD_DIR=uploads"
set "UPLOAD_MAX_SIZE_MB=10"
set "ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf"

REM ============================================================================
REM LOGGING SETTINGS
REM ============================================================================
set "LOG_LEVEL=info"
set "LOG_DIR=logs"
set "LOG_MAX_SIZE=10m"
set "LOG_MAX_FILES=5"

REM ============================================================================
REM DEVELOPMENT/DEBUG SETTINGS
REM ============================================================================
set "DEBUG_MODE=false"
set "MOCK_EMAIL=false"
set "MOCK_PAYMENTS=false"
set "VERBOSE_LOGGING=false"