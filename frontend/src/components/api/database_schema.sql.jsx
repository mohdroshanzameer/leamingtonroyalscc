-- ============================================
-- CRICKET CLUB MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    club_role VARCHAR(50),
    email_verified BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TEAMS
-- ============================================

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    is_home_team BOOLEAN DEFAULT FALSE,
    logo_url TEXT,
    home_ground VARCHAR(255),
    captain_id UUID,
    captain_name VARCHAR(255),
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- PLAYERS
-- ============================================

CREATE TABLE team_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    team_name VARCHAR(255),
    player_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    photo_url TEXT,
    date_of_birth DATE,
    date_joined DATE,
    status VARCHAR(50) DEFAULT 'Active',
    jersey_number INTEGER,
    is_captain BOOLEAN DEFAULT FALSE,
    is_vice_captain BOOLEAN DEFAULT FALSE,
    is_wicket_keeper BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'Batsman',
    batting_style VARCHAR(50),
    bowling_style VARCHAR(255),
    bio TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    medical_notes TEXT,
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
    overs_bowled DECIMAL(10,1) DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    maidens INTEGER DEFAULT 0,
    best_bowling VARCHAR(20),
    dot_balls INTEGER DEFAULT 0,
    four_wickets INTEGER DEFAULT 0,
    five_wickets INTEGER DEFAULT 0,
    catches INTEGER DEFAULT 0,
    stumpings INTEGER DEFAULT 0,
    run_outs INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- COMPETITIONS & SEASONS
-- ============================================

CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES competitions(id),
    parent_name VARCHAR(255),
    description TEXT,
    format VARCHAR(50) DEFAULT 'T20',
    status VARCHAR(50) DEFAULT 'Active',
    logo_url TEXT,
    website_url TEXT,
    organizer VARCHAR(255),
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Upcoming',
    is_current BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- TOURNAMENTS
-- ============================================

CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    season_id UUID REFERENCES seasons(id),
    season_name VARCHAR(255),
    competition_id UUID REFERENCES competitions(id),
    competition_name VARCHAR(255),
    sub_competition_id UUID REFERENCES competitions(id),
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
    entry_fee DECIMAL(10,2) DEFAULT 0,
    organizer_name VARCHAR(255),
    organizer_contact VARCHAR(255),
    match_profile_id UUID,
    match_profile_name VARCHAR(255),
    current_stage VARCHAR(50) DEFAULT 'group',
    is_public BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- TOURNAMENT TEAMS
-- ============================================

CREATE TABLE tournament_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    team_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    group_letter VARCHAR(10),
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
    overs_faced DECIMAL(10,1) DEFAULT 0,
    overs_bowled DECIMAL(10,1) DEFAULT 0,
    nrr DECIMAL(10,3) DEFAULT 0,
    is_eliminated BOOLEAN DEFAULT FALSE,
    final_position INTEGER,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- MATCHES
-- ============================================

CREATE TABLE tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id UUID,
    match_number INTEGER,
    stage VARCHAR(50) DEFAULT 'group',
    group_letter VARCHAR(10),
    round INTEGER DEFAULT 1,
    team1_id UUID REFERENCES teams(id),
    team1_name VARCHAR(255),
    team2_id UUID REFERENCES teams(id),
    team2_name VARCHAR(255),
    match_date TIMESTAMP,
    venue VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    toss_winner VARCHAR(255),
    toss_decision VARCHAR(10),
    team1_score VARCHAR(50),
    team1_overs VARCHAR(20),
    team2_score VARCHAR(50),
    team2_overs VARCHAR(20),
    winner_id UUID,
    winner_name VARCHAR(255),
    result_summary TEXT,
    man_of_match VARCHAR(255),
    mom_performance VARCHAR(255),
    is_super_over BOOLEAN DEFAULT FALSE,
    bracket_position INTEGER,
    next_match_id UUID,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- BALL BY BALL SCORING
-- ============================================

CREATE TABLE ball_by_ball (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL,
    innings INTEGER NOT NULL CHECK (innings IN (1, 2)),
    over_number INTEGER NOT NULL,
    ball_number INTEGER NOT NULL,
    batsman_id UUID,
    batsman_name VARCHAR(255) NOT NULL,
    non_striker_id UUID,
    non_striker_name VARCHAR(255),
    bowler_id UUID,
    bowler_name VARCHAR(255) NOT NULL,
    runs INTEGER DEFAULT 0,
    extras INTEGER DEFAULT 0,
    extra_type VARCHAR(50) DEFAULT '',
    is_wicket BOOLEAN DEFAULT FALSE,
    wicket_type VARCHAR(50) DEFAULT '',
    dismissed_batsman_id UUID,
    dismissed_batsman_name VARCHAR(255),
    fielder_id UUID,
    fielder_name VARCHAR(255),
    is_four BOOLEAN DEFAULT FALSE,
    is_six BOOLEAN DEFAULT FALSE,
    is_dot BOOLEAN DEFAULT FALSE,
    is_free_hit BOOLEAN DEFAULT FALSE,
    is_powerplay BOOLEAN DEFAULT FALSE,
    wagon_wheel_zone INTEGER,
    shot_type VARCHAR(50) DEFAULT '',
    commentary TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- INNINGS SCORING
-- ============================================

CREATE TABLE innings_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL,
    innings INTEGER NOT NULL CHECK (innings IN (1, 2)),
    batting_team_id UUID,
    batting_team_name VARCHAR(255) NOT NULL,
    bowling_team_id UUID,
    bowling_team_name VARCHAR(255),
    total_runs INTEGER DEFAULT 0,
    total_wickets INTEGER DEFAULT 0,
    total_overs VARCHAR(20),
    extras_wide INTEGER DEFAULT 0,
    extras_no_ball INTEGER DEFAULT 0,
    extras_bye INTEGER DEFAULT 0,
    extras_leg_bye INTEGER DEFAULT 0,
    extras_penalty INTEGER DEFAULT 0,
    run_rate DECIMAL(10,2),
    required_run_rate DECIMAL(10,2),
    target INTEGER,
    powerplay_runs INTEGER DEFAULT 0,
    powerplay_wickets INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    fall_of_wickets TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- TOURNAMENT PLAYER STATS
-- ============================================

CREATE TABLE tournament_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    tournament_team_id UUID REFERENCES tournament_teams(id),
    player_id UUID REFERENCES team_players(id),
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
    batting_avg DECIMAL(10,2) DEFAULT 0,
    strike_rate DECIMAL(10,2) DEFAULT 0,
    wickets_taken INTEGER DEFAULT 0,
    overs_bowled DECIMAL(10,1) DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    best_bowling VARCHAR(20),
    economy DECIMAL(10,2) DEFAULT 0,
    bowling_avg DECIMAL(10,2) DEFAULT 0,
    catches INTEGER DEFAULT 0,
    stumpings INTEGER DEFAULT 0,
    run_outs INTEGER DEFAULT 0,
    mom_awards INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- FINANCE TABLES
-- ============================================

CREATE TABLE finance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Income', 'Expense')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES finance_categories(id),
    category_name VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    reference VARCHAR(255),
    paid_to VARCHAR(255),
    received_from VARCHAR(255),
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Completed',
    receipt_url TEXT,
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE player_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    charge_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    charge_date DATE NOT NULL,
    due_date DATE,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    voided BOOLEAN DEFAULT FALSE,
    voided_reason TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE player_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference VARCHAR(255),
    recorded_by VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_date DATE,
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES player_payments(id) ON DELETE CASCADE,
    charge_id UUID REFERENCES player_charges(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    allocation_date DATE NOT NULL,
    allocated_by VARCHAR(255),
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    membership_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    season VARCHAR(100),
    start_date DATE,
    expiry_date DATE,
    fee_amount DECIMAL(10,2),
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- EVENTS & NEWS
-- ============================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255),
    venue VARCHAR(255),
    max_attendees INTEGER,
    rsvp_enabled BOOLEAN DEFAULT TRUE,
    rsvp_deadline TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Published',
    image_url TEXT,
    organizer VARCHAR(255),
    cost DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE event_rsvp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    guests INTEGER DEFAULT 0,
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    category VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- CONTACT & NOTIFICATIONS
-- ============================================

CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(50) DEFAULT 'normal',
    target_role VARCHAR(50),
    target_users TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_date TIMESTAMP,
    created_date TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CLUB STATS
-- ============================================

CREATE TABLE club_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season VARCHAR(100) NOT NULL,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    matches_drawn INTEGER DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    total_wickets INTEGER DEFAULT 0,
    league_position INTEGER DEFAULT 1,
    trophies_won INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- ============================================
-- MATCH AVAILABILITY
-- ============================================

CREATE TABLE match_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL,
    match_info VARCHAR(255),
    player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    player_email VARCHAR(255),
    player_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Available',
    notes TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    updated_date TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_email ON team_players(email);
CREATE INDEX idx_tournament_teams_tournament_id ON tournament_teams(tournament_id);
CREATE INDEX idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_match_date ON tournament_matches(match_date);
CREATE INDEX idx_ball_by_ball_match_id ON ball_by_ball(match_id);
CREATE INDEX idx_ball_by_ball_innings ON ball_by_ball(match_id, innings);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_player_charges_player_id ON player_charges(player_id);
CREATE INDEX idx_player_payments_player_id ON player_payments(player_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_news_created_date ON news(created_date);

-- ============================================
-- UPDATED_DATE TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TRIGGER update_users_updated_date BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        CREATE TRIGGER update_teams_updated_date BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_players') THEN
        CREATE TRIGGER update_team_players_updated_date BEFORE UPDATE ON team_players FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournaments') THEN
        CREATE TRIGGER update_tournaments_updated_date BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournament_teams') THEN
        CREATE TRIGGER update_tournament_teams_updated_date BEFORE UPDATE ON tournament_teams FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournament_matches') THEN
        CREATE TRIGGER update_tournament_matches_updated_date BEFORE UPDATE ON tournament_matches FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        CREATE TRIGGER update_transactions_updated_date BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        CREATE TRIGGER update_events_updated_date BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'news') THEN
        CREATE TRIGGER update_news_updated_date BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();
    END IF;
END $$;

-- ============================================
-- END OF SCHEMA
-- ============================================