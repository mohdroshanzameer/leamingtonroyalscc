-- Grant all permissions to cricket_admin user
-- Run this as postgres superuser:
-- psql -U postgres -d cricket_club_db -f grant_permissions.sql

-- Grant all privileges on existing tables and sequences
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cricket_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cricket_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cricket_admin;

-- Grant privileges on future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cricket_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cricket_admin;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO cricket_admin;
GRANT CREATE ON SCHEMA public TO cricket_admin;

-- If using a different DB_USER, replace 'cricket_admin' above with your actual DB_USER