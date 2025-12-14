-- Fix permissions for cricket_admin user
-- Run as postgres superuser: psql -U postgres -d cricket_club_db -f fix_permissions.sql

-- Change owner of users table specifically
ALTER TABLE users OWNER TO cricket_admin;

-- Change owner of all other tables
ALTER TABLE "Team" OWNER TO cricket_admin;
ALTER TABLE "TeamPlayer" OWNER TO cricket_admin;
ALTER TABLE "Season" OWNER TO cricket_admin;
ALTER TABLE "Competition" OWNER TO cricket_admin;
ALTER TABLE "Tournament" OWNER TO cricket_admin;
ALTER TABLE "TournamentTeam" OWNER TO cricket_admin;
ALTER TABLE "TournamentMatch" OWNER TO cricket_admin;
ALTER TABLE "MatchState" OWNER TO cricket_admin;
ALTER TABLE "InningsScore" OWNER TO cricket_admin;
ALTER TABLE "BallByBall" OWNER TO cricket_admin;
ALTER TABLE "TournamentPlayer" OWNER TO cricket_admin;
ALTER TABLE "MatchAvailability" OWNER TO cricket_admin;
ALTER TABLE "FinanceCategory" OWNER TO cricket_admin;
ALTER TABLE "Transaction" OWNER TO cricket_admin;
ALTER TABLE "PlayerCharge" OWNER TO cricket_admin;
ALTER TABLE "PlayerPayment" OWNER TO cricket_admin;
ALTER TABLE "PaymentAllocation" OWNER TO cricket_admin;
ALTER TABLE "Membership" OWNER TO cricket_admin;
ALTER TABLE "News" OWNER TO cricket_admin;
ALTER TABLE "Event" OWNER TO cricket_admin;
ALTER TABLE "EventRSVP" OWNER TO cricket_admin;
ALTER TABLE "GalleryImage" OWNER TO cricket_admin;
ALTER TABLE "ContactMessage" OWNER TO cricket_admin;
ALTER TABLE "Notification" OWNER TO cricket_admin;
ALTER TABLE "UserNotification" OWNER TO cricket_admin;
ALTER TABLE "ClubStats" OWNER TO cricket_admin;
ALTER TABLE "MatchProfile" OWNER TO cricket_admin;
ALTER TABLE "CustomStreamOverlay" OWNER TO cricket_admin;
ALTER TABLE "Sponsor" OWNER TO cricket_admin;
ALTER TABLE "SponsorPayment" OWNER TO cricket_admin;
ALTER TABLE "Invoice" OWNER TO cricket_admin;
ALTER TABLE "PaymentSettings" OWNER TO cricket_admin;
ALTER TABLE "AuthLog" OWNER TO cricket_admin;
ALTER TABLE "UserActivityLog" OWNER TO cricket_admin;
ALTER TABLE "SystemLog" OWNER TO cricket_admin;
ALTER TABLE "PaymentAuditLog" OWNER TO cricket_admin;

-- Grant all privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cricket_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cricket_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cricket_admin;

-- Grant schema privileges
GRANT USAGE ON SCHEMA public TO cricket_admin;
GRANT CREATE ON SCHEMA public TO cricket_admin;

-- Future privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cricket_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cricket_admin;

-- Verify permissions (optional - just displays info)
\dt users