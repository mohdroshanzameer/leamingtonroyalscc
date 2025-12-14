-- ============================================================================
-- CRICKET CLUB DATABASE SCHEMA - Local Authentication
-- ============================================================================
-- PostgreSQL Database Schema with bcrypt password hashing
-- Run this after creating the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE - With Password Hashing
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hashed password
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    club_role VARCHAR(50),
    phone VARCHAR(50),
    photo_url TEXT,
    date_of_birth DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- REFRESH TOKENS TABLE - For JWT Token Management
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    is_home_team BOOLEAN DEFAULT false,
    logo_url TEXT,
    home_ground VARCHAR(255),
    captain_id UUID REFERENCES users(id),
    captain_name VARCHAR(255),
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TEAM PLAYERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_name VARCHAR(255),
    player_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    photo_url TEXT,
    date_of_birth DATE,
    date_joined DATE,
    status VARCHAR(50) DEFAULT 'Active',
    jersey_number INTEGER,
    is_captain BOOLEAN DEFAULT false,
    is_vice_captain BOOLEAN DEFAULT false,
    is_wicket_keeper BOOLEAN DEFAULT false,
    role VARCHAR(50) DEFAULT 'Batsman',
    batting_style VARCHAR(50),
    bowling_style VARCHAR(255),
    bio TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    medical_notes TEXT,
    -- Career Stats
    matches_played INTEGER DEFAULT 0,
    runs_scored INTEGER DEFAULT 0,
    balls_faced INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    not_outs INTEGER DEFAULT 0,
    fours INTEGER DEFAULT 0,
    sixes INTEGER DEFAULT 0,
    fifties INTEGER DEFAULT 0,
    hundreds INTEGER DEFAULT 0,
    ducks INTEGER DEFAULT 0,
    wickets_taken INTEGER DEFAULT 0,
    overs_bowled NUMERIC(10,1) DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    maidens INTEGER DEFAULT 0,
    best_bowling VARCHAR(20),
    dot_balls INTEGER DEFAULT 0,
    four_wickets INTEGER DEFAULT 0,
    five_wickets INTEGER DEFAULT 0,
    catches INTEGER DEFAULT 0,
    stumpings INTEGER DEFAULT 0,
    run_outs INTEGER DEFAULT 0,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- AUDIT LOG - Track Security Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    action VARCHAR(100) NOT NULL,  -- 'login', 'logout', 'register', 'password_reset', 'failed_login'
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_action ON auth_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at);

-- ============================================================================
-- UPDATE TRIGGER - Auto update updated_date
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_date
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER teams_updated_date
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER team_players_updated_date
    BEFORE UPDATE ON team_players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================================================================
-- SEASONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Upcoming',
    is_current BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- COMPETITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    parent_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
    parent_name VARCHAR(255),
    description TEXT,
    format VARCHAR(50) DEFAULT 'T20',
    status VARCHAR(50) DEFAULT 'Active',
    logo_url TEXT,
    website_url TEXT,
    organizer VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MATCH PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    overs_per_innings INTEGER DEFAULT 20,
    balls_per_over INTEGER DEFAULT 6,
    powerplay_overs INTEGER,
    max_overs_per_bowler INTEGER,
    wide_runs INTEGER DEFAULT 1,
    no_ball_runs INTEGER DEFAULT 1,
    free_hit_on_no_ball BOOLEAN DEFAULT true,
    super_over_enabled BOOLEAN DEFAULT false,
    dls_enabled BOOLEAN DEFAULT false,
    points_win INTEGER DEFAULT 2,
    points_loss INTEGER DEFAULT 0,
    points_tie INTEGER DEFAULT 1,
    points_no_result INTEGER DEFAULT 1,
    is_default BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TOURNAMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
    season_name VARCHAR(255),
    competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
    competition_name VARCHAR(255),
    sub_competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
    sub_competition_name VARCHAR(255),
    format VARCHAR(50) DEFAULT 'league',
    status VARCHAR(50) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    overs_per_match INTEGER DEFAULT 20,
    balls_per_over INTEGER DEFAULT 6,
    max_teams INTEGER DEFAULT 8,
    num_groups INTEGER DEFAULT 2,
    teams_qualify_per_group INTEGER DEFAULT 2,
    banner_url TEXT,
    logo_url TEXT,
    description TEXT,
    rules TEXT,
    prize_money VARCHAR(255),
    entry_fee NUMERIC(10,2) DEFAULT 0,
    organizer_name VARCHAR(255),
    organizer_contact VARCHAR(255),
    match_profile_id UUID REFERENCES match_profiles(id) ON DELETE SET NULL,
    match_profile_name VARCHAR(255),
    current_stage VARCHAR(50) DEFAULT 'group',
    is_public BOOLEAN DEFAULT true,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TOURNAMENT TEAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tournament_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    "group" VARCHAR(10),
    seed INTEGER,
    registration_status VARCHAR(50) DEFAULT 'pending',
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    matches_tied INTEGER DEFAULT 0,
    matches_nr INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    runs_scored INTEGER DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    overs_faced NUMERIC(10,1) DEFAULT 0,
    overs_bowled NUMERIC(10,1) DEFAULT 0,
    nrr NUMERIC(10,3) DEFAULT 0,
    is_eliminated BOOLEAN DEFAULT false,
    final_position INTEGER,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TOURNAMENT MATCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id UUID,
    match_number INTEGER,
    stage VARCHAR(50) DEFAULT 'group',
    "group" VARCHAR(10),
    round INTEGER DEFAULT 1,
    team1_id UUID REFERENCES tournament_teams(id),
    team1_name VARCHAR(255),
    team2_id UUID REFERENCES tournament_teams(id),
    team2_name VARCHAR(255),
    match_date TIMESTAMP,
    venue VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    toss_winner VARCHAR(255),
    toss_decision VARCHAR(10),
    team1_score VARCHAR(50),
    team1_overs VARCHAR(10),
    team2_score VARCHAR(50),
    team2_overs VARCHAR(10),
    winner_id UUID REFERENCES tournament_teams(id),
    winner_name VARCHAR(255),
    result_summary TEXT,
    man_of_match VARCHAR(255),
    mom_performance VARCHAR(255),
    is_super_over BOOLEAN DEFAULT false,
    bracket_position INTEGER,
    next_match_id UUID REFERENCES tournament_matches(id),
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TOURNAMENT PLAYERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tournament_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    tournament_team_id UUID REFERENCES tournament_teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES team_players(id) ON DELETE SET NULL,
    player_name VARCHAR(255) NOT NULL,
    team_name VARCHAR(255),
    matches_played INTEGER DEFAULT 0,
    runs_scored INTEGER DEFAULT 0,
    balls_faced INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    fifties INTEGER DEFAULT 0,
    hundreds INTEGER DEFAULT 0,
    fours INTEGER DEFAULT 0,
    sixes INTEGER DEFAULT 0,
    not_outs INTEGER DEFAULT 0,
    batting_avg NUMERIC(10,2) DEFAULT 0,
    strike_rate NUMERIC(10,2) DEFAULT 0,
    wickets_taken INTEGER DEFAULT 0,
    overs_bowled NUMERIC(10,1) DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    best_bowling VARCHAR(20),
    economy NUMERIC(10,2) DEFAULT 0,
    bowling_avg NUMERIC(10,2) DEFAULT 0,
    catches INTEGER DEFAULT 0,
    stumpings INTEGER DEFAULT 0,
    run_outs INTEGER DEFAULT 0,
    mom_awards INTEGER DEFAULT 0,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MATCH STATE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL UNIQUE,
    innings INTEGER DEFAULT 1,
    striker VARCHAR(255),
    non_striker VARCHAR(255),
    bowler VARCHAR(255),
    toss_winner VARCHAR(10),
    toss_decision VARCHAR(10),
    batting_first VARCHAR(10),
    is_free_hit BOOLEAN DEFAULT false,
    match_settings TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INNINGS SCORE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS innings_score (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL,
    innings INTEGER NOT NULL,
    batting_team_id UUID,
    batting_team_name VARCHAR(255),
    bowling_team_id UUID,
    bowling_team_name VARCHAR(255),
    total_runs INTEGER DEFAULT 0,
    total_wickets INTEGER DEFAULT 0,
    total_overs VARCHAR(10),
    extras_wide INTEGER DEFAULT 0,
    extras_no_ball INTEGER DEFAULT 0,
    extras_bye INTEGER DEFAULT 0,
    extras_leg_bye INTEGER DEFAULT 0,
    extras_penalty INTEGER DEFAULT 0,
    run_rate NUMERIC(10,2),
    required_run_rate NUMERIC(10,2),
    target INTEGER,
    powerplay_runs INTEGER DEFAULT 0,
    powerplay_wickets INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    fall_of_wickets TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- BALL BY BALL TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ball_by_ball (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL,
    innings INTEGER NOT NULL,
    over_number INTEGER NOT NULL,
    ball_number INTEGER NOT NULL,
    batsman_id UUID REFERENCES team_players(id),
    batsman_name VARCHAR(255) NOT NULL,
    non_striker_id UUID REFERENCES team_players(id),
    non_striker_name VARCHAR(255),
    bowler_id UUID REFERENCES team_players(id),
    bowler_name VARCHAR(255) NOT NULL,
    runs INTEGER DEFAULT 0,
    extras INTEGER DEFAULT 0,
    extra_type VARCHAR(20),
    is_wicket BOOLEAN DEFAULT false,
    wicket_type VARCHAR(50),
    dismissed_batsman_id UUID REFERENCES team_players(id),
    dismissed_batsman_name VARCHAR(255),
    fielder_id UUID REFERENCES team_players(id),
    fielder_name VARCHAR(255),
    is_four BOOLEAN DEFAULT false,
    is_six BOOLEAN DEFAULT false,
    is_dot BOOLEAN DEFAULT false,
    is_free_hit BOOLEAN DEFAULT false,
    is_powerplay BOOLEAN DEFAULT false,
    wagon_wheel_zone INTEGER,
    shot_type VARCHAR(50),
    commentary TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ball_match ON ball_by_ball(match_id);
CREATE INDEX IF NOT EXISTS idx_ball_innings ON ball_by_ball(match_id, innings);

-- ============================================================================
-- MATCH AVAILABILITY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL,
    match_info VARCHAR(500),
    player_id UUID NOT NULL REFERENCES team_players(id) ON DELETE CASCADE,
    player_email VARCHAR(255),
    player_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Available',
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MEMBERSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES team_players(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    membership_type VARCHAR(50) DEFAULT 'Adult',
    status VARCHAR(50) DEFAULT 'Pending',
    season VARCHAR(50),
    start_date DATE,
    expiry_date DATE,
    fee_amount NUMERIC(10,2),
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PLAYER CHARGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES team_players(id) ON DELETE CASCADE,
    charge_type VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    description VARCHAR(500),
    charge_date DATE NOT NULL,
    due_date DATE,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    voided BOOLEAN DEFAULT false,
    voided_reason TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PLAYER PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES team_players(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference VARCHAR(255),
    recorded_by VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    verified_date DATE,
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT ALLOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES player_payments(id) ON DELETE CASCADE,
    charge_id UUID NOT NULL REFERENCES player_charges(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    allocation_date DATE,
    allocated_by VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- FINANCE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS finance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES finance_categories(id),
    category_name VARCHAR(255),
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    reference VARCHAR(255),
    paid_to VARCHAR(255),
    received_from VARCHAR(255),
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Completed',
    receipt_url TEXT,
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SPONSORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    logo_url TEXT,
    website VARCHAR(255),
    sponsor_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SPONSOR PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sponsor_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    season VARCHAR(50),
    description TEXT,
    payment_method VARCHAR(50),
    reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Received',
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    description TEXT,
    payment_method VARCHAR(50),
    paid_date DATE,
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- NEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    category VARCHAR(100),
    is_featured BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(500),
    image_url TEXT,
    category VARCHAR(100),
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT false,
    registration_deadline DATE,
    status VARCHAR(50) DEFAULT 'Upcoming',
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- EVENT RSVP TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_rsvp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id UUID REFERENCES team_players(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Going',
    guests INTEGER DEFAULT 0,
    notes TEXT,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- GALLERY IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500),
    description TEXT,
    image_url TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CONTACT MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'New',
    responded_at TIMESTAMP,
    responded_by VARCHAR(255),
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    link VARCHAR(500),
    send_to_all BOOLEAN DEFAULT false,
    target_role VARCHAR(50),
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- USER NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CLUB STATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS club_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_key VARCHAR(100) UNIQUE NOT NULL,
    stat_value VARCHAR(255),
    stat_label VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CUSTOM STREAM OVERLAYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_stream_overlays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    layout_type VARCHAR(50) DEFAULT 'full',
    theme VARCHAR(100) DEFAULT 'default',
    sponsor_url TEXT,
    is_default BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by VARCHAR(255),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    message TEXT NOT NULL,
    details TEXT,
    stack_trace TEXT,
    user_id UUID REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_date);

-- ============================================================================
-- USER ACTIVITY LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity_logs(created_date);

-- ============================================================================
-- PAYMENT AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID,
    charge_id UUID,
    action VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(255),
    ip_address VARCHAR(45),
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_created ON payment_audit_logs(created_date);

-- ============================================================================
-- UPDATE TRIGGERS FOR NEW TABLES
-- ============================================================================
CREATE TRIGGER seasons_updated_date BEFORE UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER competitions_updated_date BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER match_profiles_updated_date BEFORE UPDATE ON match_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER tournaments_updated_date BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER tournament_teams_updated_date BEFORE UPDATE ON tournament_teams FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER tournament_matches_updated_date BEFORE UPDATE ON tournament_matches FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER tournament_players_updated_date BEFORE UPDATE ON tournament_players FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER match_state_updated_date BEFORE UPDATE ON match_state FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER innings_score_updated_date BEFORE UPDATE ON innings_score FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER ball_by_ball_updated_date BEFORE UPDATE ON ball_by_ball FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER match_availability_updated_date BEFORE UPDATE ON match_availability FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER memberships_updated_date BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER player_charges_updated_date BEFORE UPDATE ON player_charges FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER player_payments_updated_date BEFORE UPDATE ON player_payments FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER payment_allocations_updated_date BEFORE UPDATE ON payment_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER finance_categories_updated_date BEFORE UPDATE ON finance_categories FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER transactions_updated_date BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER sponsors_updated_date BEFORE UPDATE ON sponsors FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER sponsor_payments_updated_date BEFORE UPDATE ON sponsor_payments FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER invoices_updated_date BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER news_updated_date BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER events_updated_date BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER event_rsvp_updated_date BEFORE UPDATE ON event_rsvp FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER gallery_images_updated_date BEFORE UPDATE ON gallery_images FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER contact_messages_updated_date BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER custom_stream_overlays_updated_date BEFORE UPDATE ON custom_stream_overlays FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================
-- Default admin user will be created by create-admin-user script
-- with properly hashed password

-- ============================================================================
-- COMPREHENSIVE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_home ON teams(is_home_team);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_captain ON teams(captain_id);

-- Team Players indexes
CREATE INDEX IF NOT EXISTS idx_players_team ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_email ON team_players(email);
CREATE INDEX IF NOT EXISTS idx_players_status ON team_players(status);
CREATE INDEX IF NOT EXISTS idx_players_role ON team_players(role);

-- Seasons indexes
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_current ON seasons(is_current);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);

-- Competitions indexes
CREATE INDEX IF NOT EXISTS idx_competitions_parent ON competitions(parent_id);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_format ON competitions(format);

-- Match Profiles indexes
CREATE INDEX IF NOT EXISTS idx_match_profiles_default ON match_profiles(is_default);

-- Tournaments indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_season ON tournaments(season_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_competition ON tournaments(competition_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_sub_comp ON tournaments(sub_competition_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_format ON tournaments(format);
CREATE INDEX IF NOT EXISTS idx_tournaments_public ON tournaments(is_public);

-- Tournament Teams indexes
CREATE INDEX IF NOT EXISTS idx_tourney_teams_tournament ON tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourney_teams_team ON tournament_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_tourney_teams_group ON tournament_teams("group");
CREATE INDEX IF NOT EXISTS idx_tourney_teams_status ON tournament_teams(registration_status);
CREATE INDEX IF NOT EXISTS idx_tourney_teams_points ON tournament_teams(tournament_id, points DESC);

-- Tournament Matches indexes
CREATE INDEX IF NOT EXISTS idx_tourney_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourney_matches_team1 ON tournament_matches(team1_id);
CREATE INDEX IF NOT EXISTS idx_tourney_matches_team2 ON tournament_matches(team2_id);
CREATE INDEX IF NOT EXISTS idx_tourney_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tourney_matches_date ON tournament_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_tourney_matches_stage ON tournament_matches(stage);
CREATE INDEX IF NOT EXISTS idx_tourney_matches_group ON tournament_matches("group");

-- Tournament Players indexes
CREATE INDEX IF NOT EXISTS idx_tourney_players_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourney_players_team ON tournament_players(tournament_team_id);
CREATE INDEX IF NOT EXISTS idx_tourney_players_player ON tournament_players(player_id);
CREATE INDEX IF NOT EXISTS idx_tourney_players_runs ON tournament_players(tournament_id, runs_scored DESC);
CREATE INDEX IF NOT EXISTS idx_tourney_players_wickets ON tournament_players(tournament_id, wickets_taken DESC);

-- Match State indexes
CREATE INDEX IF NOT EXISTS idx_match_state_match ON match_state(match_id);

-- Innings Score indexes
CREATE INDEX IF NOT EXISTS idx_innings_match ON innings_score(match_id);
CREATE INDEX IF NOT EXISTS idx_innings_match_innings ON innings_score(match_id, innings);

-- Match Availability indexes
CREATE INDEX IF NOT EXISTS idx_availability_match ON match_availability(match_id);
CREATE INDEX IF NOT EXISTS idx_availability_player ON match_availability(player_id);
CREATE INDEX IF NOT EXISTS idx_availability_email ON match_availability(player_email);
CREATE INDEX IF NOT EXISTS idx_availability_status ON match_availability(status);

-- Memberships indexes
CREATE INDEX IF NOT EXISTS idx_memberships_player ON memberships(player_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships(email);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_type ON memberships(membership_type);
CREATE INDEX IF NOT EXISTS idx_memberships_season ON memberships(season);
CREATE INDEX IF NOT EXISTS idx_memberships_dates ON memberships(start_date, expiry_date);

-- Player Charges indexes
CREATE INDEX IF NOT EXISTS idx_charges_player ON player_charges(player_id);
CREATE INDEX IF NOT EXISTS idx_charges_type ON player_charges(charge_type);
CREATE INDEX IF NOT EXISTS idx_charges_date ON player_charges(charge_date);
CREATE INDEX IF NOT EXISTS idx_charges_voided ON player_charges(voided);
CREATE INDEX IF NOT EXISTS idx_charges_reference ON player_charges(reference_type, reference_id);

-- Player Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_player ON player_payments(player_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON player_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_verified ON player_payments(verified);
CREATE INDEX IF NOT EXISTS idx_payments_method ON player_payments(payment_method);

-- Payment Allocations indexes
CREATE INDEX IF NOT EXISTS idx_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_allocations_charge ON payment_allocations(charge_id);
CREATE INDEX IF NOT EXISTS idx_allocations_date ON payment_allocations(allocation_date);

-- Finance Categories indexes
CREATE INDEX IF NOT EXISTS idx_finance_cats_type ON finance_categories(type);
CREATE INDEX IF NOT EXISTS idx_finance_cats_active ON finance_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_finance_cats_order ON finance_categories(display_order);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_method ON transactions(payment_method);

-- Sponsors indexes
CREATE INDEX IF NOT EXISTS idx_sponsors_status ON sponsors(status);
CREATE INDEX IF NOT EXISTS idx_sponsors_type ON sponsors(sponsor_type);
CREATE INDEX IF NOT EXISTS idx_sponsors_email ON sponsors(email);

-- Sponsor Payments indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_sponsor ON sponsor_payments(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_date ON sponsor_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_season ON sponsor_payments(season);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_status ON sponsor_payments(status);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_email ON invoices(recipient_email);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_dates ON invoices(issue_date, due_date);

-- News indexes
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_featured ON news(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_created ON news(created_date DESC);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_date DESC);

-- Event RSVP indexes
CREATE INDEX IF NOT EXISTS idx_rsvp_event ON event_rsvp(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_player ON event_rsvp(player_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_email ON event_rsvp(email);
CREATE INDEX IF NOT EXISTS idx_rsvp_status ON event_rsvp(status);

-- Gallery Images indexes
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_images(category);
CREATE INDEX IF NOT EXISTS idx_gallery_featured ON gallery_images(is_featured);
CREATE INDEX IF NOT EXISTS idx_gallery_created ON gallery_images(created_date DESC);

-- Contact Messages indexes
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_date DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_date DESC);

-- User Notifications indexes
CREATE INDEX IF NOT EXISTS idx_user_notifs_notification ON user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_notifs_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifs_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifs_created ON user_notifications(created_date DESC);

-- Club Stats indexes
CREATE INDEX IF NOT EXISTS idx_club_stats_key ON club_stats(stat_key);
CREATE INDEX IF NOT EXISTS idx_club_stats_order ON club_stats(display_order);

-- Custom Stream Overlays indexes
CREATE INDEX IF NOT EXISTS idx_overlays_user ON custom_stream_overlays(created_by);
CREATE INDEX IF NOT EXISTS idx_overlays_default ON custom_stream_overlays(is_default);

-- Payment Settings indexes
CREATE INDEX IF NOT EXISTS idx_payment_settings_key ON payment_settings(setting_key);

-- Payment Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_payment_audit_payment ON payment_audit_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_charge ON payment_audit_logs(charge_id);

-- ============================================================================
-- ADDITIONAL HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate Net Run Rate
CREATE OR REPLACE FUNCTION calculate_nrr(
    p_runs_scored INTEGER,
    p_overs_faced NUMERIC,
    p_runs_conceded INTEGER,
    p_overs_bowled NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
    IF p_overs_faced = 0 OR p_overs_bowled = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND((p_runs_scored::NUMERIC / p_overs_faced) - (p_runs_conceded::NUMERIC / p_overs_bowled), 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate Batting Average
CREATE OR REPLACE FUNCTION calculate_batting_avg(
    p_runs INTEGER,
    p_matches INTEGER,
    p_not_outs INTEGER
) RETURNS NUMERIC AS $$
DECLARE
    v_dismissals INTEGER;
BEGIN
    v_dismissals := p_matches - p_not_outs;
    IF v_dismissals = 0 THEN
        RETURN p_runs::NUMERIC;
    END IF;
    RETURN ROUND(p_runs::NUMERIC / v_dismissals, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate Strike Rate
CREATE OR REPLACE FUNCTION calculate_strike_rate(
    p_runs INTEGER,
    p_balls INTEGER
) RETURNS NUMERIC AS $$
BEGIN
    IF p_balls = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND((p_runs::NUMERIC / p_balls) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate Bowling Average
CREATE OR REPLACE FUNCTION calculate_bowling_avg(
    p_runs_conceded INTEGER,
    p_wickets INTEGER
) RETURNS NUMERIC AS $$
BEGIN
    IF p_wickets = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(p_runs_conceded::NUMERIC / p_wickets, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate Economy Rate
CREATE OR REPLACE FUNCTION calculate_economy(
    p_runs_conceded INTEGER,
    p_overs NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
    IF p_overs = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(p_runs_conceded::NUMERIC / p_overs, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to convert overs to balls (20.3 -> 123 balls)
CREATE OR REPLACE FUNCTION overs_to_balls(p_overs NUMERIC) RETURNS INTEGER AS $$
DECLARE
    v_complete_overs INTEGER;
    v_balls_in_over INTEGER;
BEGIN
    v_complete_overs := FLOOR(p_overs);
    v_balls_in_over := ROUND((p_overs - v_complete_overs) * 10);
    RETURN (v_complete_overs * 6) + v_balls_in_over;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to convert balls to overs (123 balls -> 20.3)
CREATE OR REPLACE FUNCTION balls_to_overs(p_balls INTEGER) RETURNS NUMERIC AS $$
DECLARE
    v_complete_overs INTEGER;
    v_remaining_balls INTEGER;
BEGIN
    v_complete_overs := p_balls / 6;
    v_remaining_balls := p_balls % 6;
    RETURN v_complete_overs + (v_remaining_balls::NUMERIC / 10);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================
-- Default admin user will be created by create-admin-user script
-- with properly hashed password

-- Insert default finance categories
INSERT INTO finance_categories (name, type, description, display_order) VALUES
('Membership Fees', 'Income', 'Player and club membership fees', 1),
('Match Fees', 'Income', 'Player fees for matches', 2),
('Sponsorships', 'Income', 'Sponsor payments and donations', 3),
('Fundraising', 'Income', 'Fundraising events and activities', 4),
('Other Income', 'Income', 'Miscellaneous income', 5),
('Equipment', 'Expense', 'Cricket equipment and gear', 6),
('Facility Costs', 'Expense', 'Ground rental and facility fees', 7),
('Tournament Fees', 'Expense', 'Registration and entry fees for tournaments', 8),
('Travel', 'Expense', 'Travel costs for away matches', 9),
('Administrative', 'Expense', 'Admin costs and office expenses', 10),
('Utilities', 'Expense', 'Electricity, water, internet', 11),
('Insurance', 'Expense', 'Club and player insurance', 12),
('Marketing', 'Expense', 'Promotional materials and advertising', 13),
('Other Expenses', 'Expense', 'Miscellaneous expenses', 14)
ON CONFLICT DO NOTHING;

-- Insert default club stats
INSERT INTO club_stats (stat_key, stat_value, stat_label, display_order) VALUES
('total_members', '0', 'Active Members', 1),
('total_matches', '0', 'Matches Played', 2),
('total_wins', '0', 'Matches Won', 3),
('years_established', '1', 'Years Established', 4)
ON CONFLICT DO NOTHING;