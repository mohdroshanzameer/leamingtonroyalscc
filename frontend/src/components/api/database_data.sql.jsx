-- ============================================================================
-- CRICKET CLUB MANAGEMENT SYSTEM - SAMPLE DATA INSERT SCRIPT
-- ============================================================================
-- This script populates the database with sample data for testing
-- Run after applying database_schema.sql
-- ============================================================================

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE "UserNotification", "Notification", "ContactMessage", "GalleryImage", 
  "EventRSVP", "Event", "News", "PaymentAllocation", "PlayerPayment", "PlayerCharge", 
  "Membership", "MatchAvailability", "BallByBall", "InningsScore", "MatchState", 
  "TournamentPlayer", "TournamentMatch", "TournamentTeam", "Tournament", "Competition", 
  "Season", "TeamPlayer", "Team", "User" CASCADE;

-- ============================================================================
-- USERS
-- ============================================================================
INSERT INTO "User" (id, email, full_name, role, created_date) VALUES
('usr_001', 'admin@lrcc.com', 'John Smith', 'admin', NOW()),
('usr_002', 'captain@lrcc.com', 'Mike Johnson', 'user', NOW()),
('usr_003', 'player1@lrcc.com', 'David Williams', 'user', NOW()),
('usr_004', 'player2@lrcc.com', 'James Brown', 'user', NOW()),
('usr_005', 'player3@lrcc.com', 'Robert Davis', 'user', NOW()),
('usr_006', 'treasurer@lrcc.com', 'Sarah Wilson', 'user', NOW()),
('usr_007', 'player4@lrcc.com', 'Chris Taylor', 'user', NOW()),
('usr_008', 'player5@lrcc.com', 'Tom Anderson', 'user', NOW());

-- ============================================================================
-- TEAMS
-- ============================================================================
INSERT INTO "Team" (id, name, short_name, is_home_team, logo_url, home_ground, captain_name, primary_color, secondary_color, status, created_date) VALUES
('team_001', 'Leamington Royals Cricket Club', 'LRCC', true, 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6929785c4d5b8d941b54d863/1be3324ef_Picsart_25-11-30_11-34-29-234.png', 'Leamington Cricket Ground', 'Mike Johnson', '#00d4ff', '#ffffff', 'Active', NOW()),
('team_002', 'Birmingham Hawks', 'BH', false, NULL, 'Birmingham Sports Arena', 'Alex Turner', '#ff3b5c', '#ffffff', 'Active', NOW()),
('team_003', 'Coventry Lions', 'CL', false, NULL, 'Coventry Stadium', 'Paul Green', '#ffb800', '#000000', 'Active', NOW()),
('team_004', 'Warwick Warriors', 'WW', false, NULL, 'Warwick Ground', 'Mark White', '#00ff88', '#000000', 'Active', NOW()),
('team_005', 'Stratford Strikers', 'SS', false, NULL, 'Stratford Park', 'Simon Black', '#c4b5fd', '#000000', 'Active', NOW());

-- ============================================================================
-- TEAM PLAYERS
-- ============================================================================
INSERT INTO "TeamPlayer" (id, team_id, team_name, player_name, email, phone, date_of_birth, date_joined, status, jersey_number, is_captain, is_vice_captain, is_wicket_keeper, role, batting_style, bowling_style, matches_played, runs_scored, balls_faced, highest_score, wickets_taken, overs_bowled, created_date) VALUES
('plr_001', 'team_001', 'LRCC', 'Mike Johnson', 'captain@lrcc.com', '07700123456', '1988-05-15', '2020-01-01', 'Active', 7, true, false, false, 'All-Rounder', 'Right-handed', 'Right-arm medium', 45, 1250, 980, 89, 32, 120.5, NOW()),
('plr_002', 'team_001', 'LRCC', 'David Williams', 'player1@lrcc.com', '07700234567', '1990-08-22', '2020-02-15', 'Active', 10, false, true, false, 'Batsman', 'Left-handed', NULL, 42, 1580, 1200, 112, 0, 0, NOW()),
('plr_003', 'team_001', 'LRCC', 'James Brown', 'player2@lrcc.com', '07700345678', '1992-03-10', '2020-03-20', 'Active', 15, false, false, true, 'Wicket-Keeper', 'Right-handed', NULL, 40, 890, 720, 68, 0, 0, NOW()),
('plr_004', 'team_001', 'LRCC', 'Robert Davis', 'player3@lrcc.com', '07700456789', '1985-11-30', '2019-12-01', 'Active', 21, false, false, false, 'Bowler', 'Right-handed', 'Right-arm fast', 48, 320, 280, 42, 68, 180.3, NOW()),
('plr_005', 'team_001', 'LRCC', 'Chris Taylor', 'player4@lrcc.com', '07700567890', '1993-07-18', '2021-01-10', 'Active', 3, false, false, false, 'All-Rounder', 'Right-handed', 'Right-arm spin', 38, 720, 650, 65, 45, 95.2, NOW()),
('plr_006', 'team_001', 'LRCC', 'Tom Anderson', 'player5@lrcc.com', '07700678901', '1991-09-25', '2021-03-15', 'Active', 9, false, false, false, 'Batsman', 'Right-handed', NULL, 35, 980, 850, 78, 0, 0, NOW()),
('plr_007', 'team_001', 'LRCC', 'Luke Martin', NULL, '07700789012', '1994-04-12', '2021-05-20', 'Active', 11, false, false, false, 'Bowler', 'Right-handed', 'Left-arm fast', 32, 180, 150, 28, 52, 110.4, NOW()),
('plr_008', 'team_001', 'LRCC', 'Ryan Thomas', NULL, '07700890123', '1989-12-05', '2020-06-01', 'Active', 5, false, false, false, 'All-Rounder', 'Left-handed', 'Slow left-arm', 40, 650, 580, 55, 38, 88.5, NOW());

-- ============================================================================
-- SEASONS
-- ============================================================================
INSERT INTO "Season" (id, name, start_date, end_date, status, is_current, created_date) VALUES
('ssn_001', '2024-2025', '2024-09-01', '2025-08-31', 'Active', true, NOW()),
('ssn_002', '2025-2026', '2025-09-01', '2026-08-31', 'Upcoming', false, NOW());

-- ============================================================================
-- COMPETITIONS
-- ============================================================================
INSERT INTO "Competition" (id, name, short_name, description, format, status, logo_url, organizer, created_date) VALUES
('comp_001', 'Warwickshire Cricket League', 'WCL', 'Premier cricket competition in Warwickshire', 'T20', 'Active', NULL, 'Warwickshire Cricket Board', NOW()),
('comp_002', 'WCL Division 9', 'WCL-D9', 'Division 9 of Warwickshire Cricket League', 'T20', 'Active', NULL, 'Warwickshire Cricket Board', NOW()),
('comp_003', 'Leamington Masters Series', 'LMS', 'Indoor cricket competition', 'T10', 'Active', NULL, 'Leamington Cricket Association', NOW()),
('comp_004', 'Summer Cup', 'SC', 'Knockout tournament', 'T20', 'Active', NULL, 'Regional Cricket Board', NOW());

-- Update parent references
UPDATE "Competition" SET parent_id = 'comp_001', parent_name = 'Warwickshire Cricket League' WHERE id = 'comp_002';

-- ============================================================================
-- TOURNAMENTS
-- ============================================================================
INSERT INTO "Tournament" (id, name, short_name, season_id, season_name, competition_id, competition_name, sub_competition_id, sub_competition_name, format, status, start_date, end_date, overs_per_match, max_teams, current_stage, created_date) VALUES
('trn_001', 'WCL - Division 9 - 2024-2025', 'WCL D9 24/25', 'ssn_001', '2024-2025', 'comp_001', 'Warwickshire Cricket League', 'comp_002', 'WCL Division 9', 'league', 'ongoing', '2024-09-15', '2025-05-30', 20, 10, 'league', NOW()),
('trn_002', 'LMS - 2024-2025', 'LMS 24/25', 'ssn_001', '2024-2025', 'comp_003', 'Leamington Masters Series', NULL, NULL, 'league', 'ongoing', '2024-11-01', '2025-03-31', 10, 8, 'league', NOW()),
('trn_003', 'Summer Cup 2025', 'SC 2025', 'ssn_001', '2024-2025', 'comp_004', 'Summer Cup', NULL, NULL, 'knockout', 'registration', '2025-06-01', '2025-08-15', 20, 16, 'group', NOW());

-- ============================================================================
-- TOURNAMENT TEAMS
-- ============================================================================
INSERT INTO "TournamentTeam" (id, tournament_id, team_id, team_name, short_name, matches_played, matches_won, matches_lost, points, runs_scored, runs_conceded, overs_faced, overs_bowled, nrr, created_date) VALUES
('tt_001', 'trn_001', 'team_001', 'Leamington Royals CC', 'LRCC', 8, 5, 3, 10, 1250, 1180, 160.0, 160.0, 0.25, NOW()),
('tt_002', 'trn_001', 'team_002', 'Birmingham Hawks', 'BH', 8, 6, 2, 12, 1320, 1150, 160.0, 160.0, 0.45, NOW()),
('tt_003', 'trn_001', 'team_003', 'Coventry Lions', 'CL', 8, 4, 4, 8, 1200, 1220, 160.0, 160.0, -0.08, NOW()),
('tt_004', 'trn_001', 'team_004', 'Warwick Warriors', 'WW', 8, 3, 5, 6, 1150, 1280, 160.0, 160.0, -0.35, NOW()),
('tt_005', 'trn_002', 'team_001', 'Leamington Royals CC', 'LRCC', 6, 4, 2, 8, 680, 620, 60.0, 60.0, 0.42, NOW());

-- ============================================================================
-- TOURNAMENT MATCHES
-- ============================================================================
INSERT INTO "TournamentMatch" (id, tournament_id, match_number, stage, team1_id, team1_name, team2_id, team2_name, match_date, venue, status, toss_winner, toss_decision, team1_score, team1_overs, team2_score, team2_overs, winner_id, winner_name, result_summary, man_of_match, created_date) VALUES
-- Completed matches
('mtch_001', 'trn_001', 1, 'league', 'team_001', 'LRCC', 'team_002', 'Birmingham Hawks', '2024-09-22 14:00:00', 'Leamington Cricket Ground', 'completed', 'team_001', 'bat', '165/7', '20.0', '158/8', '20.0', 'team_001', 'LRCC', 'LRCC won by 7 runs', 'David Williams', NOW()),
('mtch_002', 'trn_001', 2, 'league', 'team_003', 'Coventry Lions', 'team_001', 'LRCC', '2024-10-06 14:00:00', 'Coventry Stadium', 'completed', 'team_003', 'bat', '142/9', '20.0', '145/5', '18.2', 'team_001', 'LRCC', 'LRCC won by 5 wickets', 'Mike Johnson', NOW()),
('mtch_003', 'trn_001', 3, 'league', 'team_001', 'LRCC', 'team_004', 'Warwick Warriors', '2024-10-20 14:00:00', 'Leamington Cricket Ground', 'completed', 'team_004', 'bowl', '178/6', '20.0', '165/9', '20.0', 'team_001', 'LRCC', 'LRCC won by 13 runs', 'Chris Taylor', NOW()),

-- Upcoming matches
('mtch_004', 'trn_001', 9, 'league', 'team_001', 'LRCC', 'team_003', 'Coventry Lions', '2025-01-15 14:00:00', 'Leamington Cricket Ground', 'scheduled', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
('mtch_005', 'trn_001', 10, 'league', 'team_002', 'Birmingham Hawks', 'team_001', 'LRCC', '2025-02-05 14:00:00', 'Birmingham Sports Arena', 'scheduled', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
('mtch_006', 'trn_001', 11, 'league', 'team_001', 'LRCC', 'team_005', 'Stratford Strikers', '2025-02-22 14:00:00', 'Leamington Cricket Ground', 'scheduled', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW());

-- ============================================================================
-- NEWS
-- ============================================================================
INSERT INTO "News" (id, title, content, excerpt, image_url, category, is_featured, created_date, created_by) VALUES
('news_001', 'LRCC Wins Thriller Against Birmingham Hawks', 
'Leamington Royals Cricket Club secured a thrilling 7-run victory against Birmingham Hawks in their opening match of the WCL Division 9 season. David Williams top-scored with a brilliant 68 off 45 balls, while Robert Davis claimed 3 wickets for 32 runs.

The match at Leamington Cricket Ground saw LRCC post a competitive 165/7 in their 20 overs. Birmingham Hawks started strongly but fell short, finishing on 158/8.

Captain Mike Johnson praised the team''s performance: "It was a great team effort. David''s innings set us up, and our bowlers defended the total brilliantly."',
'LRCC secures opening win with David Williams starring with 68 runs',
'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80',
'Match Report', true, NOW(), 'usr_001'),

('news_002', 'Season Registration Now Open',
'Registration for the 2025-2026 season is now open! All current and prospective members are invited to register for next season.

Membership benefits include:
- Full access to club facilities
- Participation in all league matches
- Professional coaching sessions
- Social events throughout the season

Early bird discount available until January 31st. Visit the Contact page to get in touch.',
'Register now for the 2025-2026 season with early bird discounts',
'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=1200&q=80',
'Announcement', true, NOW(), 'usr_001'),

('news_003', 'Winter Training Sessions Start December',
'Indoor winter training sessions will commence from December 1st at Leamington Sports Centre. 

Sessions will be held every Tuesday and Thursday evening from 7pm-9pm. All players are encouraged to attend to maintain fitness and improve skills during the off-season.

Contact the club secretary to book your spot.',
'Winter training commences December 1st - book your spot now',
'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=1200&q=80',
'Club News', false, NOW(), 'usr_001'),

('news_004', 'Mike Johnson Reaches 1000 Runs Milestone',
'Club captain Mike Johnson reached the remarkable milestone of 1000 runs for LRCC during last weekend''s match against Warwick Warriors.

Johnson, who joined the club in 2020, has been a consistent performer with both bat and ball. His all-round abilities have been crucial to the team''s success in recent seasons.

Congratulations Mike on this outstanding achievement!',
'Captain reaches 1000 runs milestone for the club',
'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&q=80',
'Player News', false, NOW(), 'usr_001');

-- ============================================================================
-- EVENTS
-- ============================================================================
INSERT INTO "Event" (id, title, description, event_date, end_date, location, event_type, max_attendees, registration_deadline, status, created_date, created_by) VALUES
('evt_001', 'Annual Club Dinner 2025', 
'Join us for our annual club dinner celebrating another successful season. The evening will include a three-course meal, awards presentation, and entertainment.

Dress code: Smart casual
Cost: £35 per person (includes meal and drinks)',
'2025-08-30 19:00:00', '2025-08-30 23:00:00', 'Leamington Golf Club', 'Social', 100, '2025-08-15', 'Published', NOW(), 'usr_001'),

('evt_002', 'Pre-Season Fitness Camp',
'Intensive two-day fitness camp to prepare for the upcoming season. Professional trainers will lead sessions focusing on cricket-specific fitness, agility, and strength.

All players welcome. Equipment provided.',
'2025-08-15 09:00:00', '2025-08-16 17:00:00', 'Leamington Cricket Ground', 'Training', 30, '2025-08-01', 'Published', NOW(), 'usr_001'),

('evt_003', 'Junior Cricket Coaching Day',
'Free cricket coaching day for children aged 8-16. Come along and learn from our experienced coaches. All equipment provided.

Parents welcome to watch. Refreshments available.',
'2025-07-20 10:00:00', '2025-07-20 16:00:00', 'Leamington Cricket Ground', 'Community', 50, '2025-07-15', 'Published', NOW(), 'usr_001');

-- ============================================================================
-- GALLERY IMAGES
-- ============================================================================
INSERT INTO "GalleryImage" (id, title, description, image_url, category, created_date, created_by) VALUES
('gal_001', 'Opening Match Victory', 'Team celebrates after winning against Birmingham Hawks', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80', 'Matches', NOW(), 'usr_001'),
('gal_002', 'Captain Mike Johnson', 'Mike Johnson in action during match', 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=1200&q=80', 'Players', NOW(), 'usr_001'),
('gal_003', 'Team Training Session', 'Players during pre-season training', 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=1200&q=80', 'Training', NOW(), 'usr_001'),
('gal_004', 'Ground View', 'Beautiful view of Leamington Cricket Ground', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&q=80', 'Grounds', NOW(), 'usr_001'),
('gal_005', 'Championship Trophy', '2023 Division Champions', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80', 'Events', NOW(), 'usr_001');

-- ============================================================================
-- MEMBERSHIPS
-- ============================================================================
INSERT INTO "Membership" (id, player_id, member_name, email, membership_type, status, season, start_date, expiry_date, fee_amount, created_date) VALUES
('mem_001', 'plr_001', 'Mike Johnson', 'captain@lrcc.com', 'Adult', 'Active', '2024-2025', '2024-09-01', '2025-08-31', 250, NOW()),
('mem_002', 'plr_002', 'David Williams', 'player1@lrcc.com', 'Adult', 'Active', '2024-2025', '2024-09-01', '2025-08-31', 250, NOW()),
('mem_003', 'plr_003', 'James Brown', 'player2@lrcc.com', 'Adult', 'Active', '2024-2025', '2024-09-01', '2025-08-31', 250, NOW()),
('mem_004', 'plr_004', 'Robert Davis', 'player3@lrcc.com', 'Adult', 'Active', '2024-2025', '2024-09-01', '2025-08-31', 250, NOW()),
('mem_005', 'plr_005', 'Chris Taylor', 'player4@lrcc.com', 'Adult', 'Active', '2024-2025', '2024-09-01', '2025-08-31', 250, NOW());

-- ============================================================================
-- PLAYER CHARGES
-- ============================================================================
INSERT INTO "PlayerCharge" (id, player_id, charge_type, amount, description, charge_date, due_date, notes, created_date) VALUES
('chg_001', 'plr_001', 'membership', 250, '2024-2025 Season Membership', '2024-09-01', '2024-10-01', 'Annual membership fee', NOW()),
('chg_002', 'plr_002', 'membership', 250, '2024-2025 Season Membership', '2024-09-01', '2024-10-01', 'Annual membership fee', NOW()),
('chg_003', 'plr_001', 'match_fee', 10, 'Match fee - vs Birmingham Hawks', '2024-09-22', '2024-09-22', NULL, NOW()),
('chg_004', 'plr_002', 'match_fee', 10, 'Match fee - vs Birmingham Hawks', '2024-09-22', '2024-09-22', NULL, NOW()),
('chg_005', 'plr_003', 'match_fee', 10, 'Match fee - vs Birmingham Hawks', '2024-09-22', '2024-09-22', NULL, NOW());

-- ============================================================================
-- PLAYER PAYMENTS
-- ============================================================================
INSERT INTO "PlayerPayment" (id, player_id, amount, payment_date, payment_method, reference, recorded_by, verified, created_date) VALUES
('pay_001', 'plr_001', 250, '2024-09-05', 'Bank Transfer', 'REF123456', 'usr_006', true, NOW()),
('pay_002', 'plr_002', 250, '2024-09-08', 'Bank Transfer', 'REF123457', 'usr_006', true, NOW()),
('pay_003', 'plr_001', 50, '2024-10-01', 'Cash', NULL, 'usr_006', true, NOW()),
('pay_004', 'plr_002', 40, '2024-10-15', 'Cash', NULL, 'usr_006', true, NOW());

-- ============================================================================
-- MATCH AVAILABILITY
-- ============================================================================
INSERT INTO "MatchAvailability" (id, match_id, match_info, player_id, player_email, player_name, status, created_date) VALUES
('avl_001', 'mtch_004', 'LRCC vs Coventry Lions - 15 Jan', 'plr_001', 'captain@lrcc.com', 'Mike Johnson', 'Available', NOW()),
('avl_002', 'mtch_004', 'LRCC vs Coventry Lions - 15 Jan', 'plr_002', 'player1@lrcc.com', 'David Williams', 'Available', NOW()),
('avl_003', 'mtch_004', 'LRCC vs Coventry Lions - 15 Jan', 'plr_003', 'player2@lrcc.com', 'James Brown', 'Available', NOW()),
('avl_004', 'mtch_004', 'LRCC vs Coventry Lions - 15 Jan', 'plr_004', 'player3@lrcc.com', 'Robert Davis', 'Maybe', NOW()),
('avl_005', 'mtch_005', 'Birmingham Hawks vs LRCC - 5 Feb', 'plr_001', 'captain@lrcc.com', 'Mike Johnson', 'Available', NOW()),
('avl_006', 'mtch_005', 'Birmingham Hawks vs LRCC - 5 Feb', 'plr_002', 'player1@lrcc.com', 'David Williams', 'Available', NOW());

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
INSERT INTO "Notification" (id, title, message, type, created_date) VALUES
('ntf_001', 'Match Reminder', 'Match against Coventry Lions tomorrow at 2 PM', 'Match', NOW() - INTERVAL '1 day'),
('ntf_002', 'Registration Open', '2025-2026 season registration is now open', 'Announcement', NOW() - INTERVAL '2 days'),
('ntf_003', 'Payment Due', 'Membership payment due by end of month', 'Payment', NOW() - INTERVAL '5 days');

-- ============================================================================
-- FINANCE CATEGORIES
-- ============================================================================
INSERT INTO "FinanceCategory" (id, name, type, description, is_active, display_order, created_date) VALUES
('fcat_001', 'Match Fees', 'Income', 'Player match participation fees', true, 1, NOW()),
('fcat_002', 'Membership Dues', 'Income', 'Annual membership subscriptions', true, 2, NOW()),
('fcat_003', 'Sponsorships', 'Income', 'Corporate and individual sponsorships', true, 3, NOW()),
('fcat_004', 'Event Revenue', 'Income', 'Revenue from club events', true, 4, NOW()),
('fcat_005', 'Equipment', 'Expense', 'Cricket equipment and gear', true, 1, NOW()),
('fcat_006', 'Ground Maintenance', 'Expense', 'Ground upkeep and maintenance', true, 2, NOW()),
('fcat_007', 'League Fees', 'Expense', 'Competition registration and fees', true, 3, NOW()),
('fcat_008', 'Utilities', 'Expense', 'Electricity, water, and other utilities', true, 4, NOW());

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================
INSERT INTO "Transaction" (id, category_id, category_name, type, amount, description, date, payment_method, status, created_date) VALUES
('trx_001', 'fcat_002', 'Membership Dues', 'Income', 250, 'Annual membership - Mike Johnson', '2024-09-05', 'Bank Transfer', 'Completed', NOW()),
('trx_002', 'fcat_002', 'Membership Dues', 'Income', 250, 'Annual membership - David Williams', '2024-09-08', 'Bank Transfer', 'Completed', NOW()),
('trx_003', 'fcat_005', 'Equipment', 'Expense', 450, 'New cricket balls (12 pack)', '2024-09-10', 'Card', 'Completed', NOW()),
('trx_004', 'fcat_001', 'Match Fees', 'Income', 110, 'Match fees - vs Birmingham Hawks', '2024-09-22', 'Cash', 'Completed', NOW()),
('trx_005', 'fcat_007', 'League Fees', 'Expense', 300, 'WCL Division 9 registration', '2024-09-15', 'Bank Transfer', 'Completed', NOW());

-- ============================================================================
-- SPONSORS
-- ============================================================================
INSERT INTO "Sponsor" (id, company_name, contact_name, email, phone, logo_url, sponsorship_level, amount, amount_paid, start_date, end_date, status, season, created_date) VALUES
('spo_001', 'Local Motors Ltd', 'John Smith', 'john@localmotors.com', '01234567890', NULL, 'Gold', 2000, 2000, '2024-09-01', '2025-08-31', 'Active', '2024-2025', NOW()),
('spo_002', 'Pizza Palace', 'Maria Garcia', 'maria@pizzapalace.com', '01234567891', NULL, 'Silver', 1000, 500, '2024-09-01', '2025-08-31', 'Active', '2024-2025', NOW()),
('spo_003', 'Tech Solutions Inc', 'David Chen', 'david@techsolutions.com', '01234567892', NULL, 'Bronze', 500, 500, '2024-10-01', '2025-08-31', 'Active', '2024-2025', NOW());

-- ============================================================================
-- EVENT RSVPs
-- ============================================================================
INSERT INTO "EventRSVP" (id, event_id, player_id, status, additional_guests, created_date) VALUES
('rsvp_001', 'evt_001', 'plr_001', 'Going', 1, NOW()),
('rsvp_002', 'evt_001', 'plr_002', 'Going', 0, NOW()),
('rsvp_003', 'evt_001', 'plr_003', 'Maybe', 1, NOW()),
('rsvp_004', 'evt_002', 'plr_001', 'Going', 0, NOW()),
('rsvp_005', 'evt_002', 'plr_004', 'Going', 0, NOW());

-- ============================================================================
-- MATCH PROFILES
-- ============================================================================
INSERT INTO "MatchProfile" (id, name, is_default, total_overs, balls_per_over, wide_1st_runs, noball_1st_runs, free_hit_on_noball, powerplay_overs, max_overs_per_bowler, created_date) VALUES
('mp_001', 'ICC T20 Standard', true, 20, 6, 1, 1, true, 6, 4, NOW()),
('mp_002', 'LMS Indoor Rules', false, 10, 6, 2, 2, false, 3, 2, NOW()),
('mp_003', 'T10 Format', false, 10, 6, 1, 1, true, 3, 2, NOW());

-- ============================================================================
-- TOURNAMENT PLAYERS (Stats)
-- ============================================================================
INSERT INTO "TournamentPlayer" (id, tournament_id, tournament_team_id, player_id, player_name, team_name, matches_played, runs_scored, balls_faced, highest_score, wickets_taken, overs_bowled, runs_conceded, catches, batting_avg, strike_rate, economy, created_date) VALUES
('tp_001', 'trn_001', 'tt_001', 'plr_001', 'Mike Johnson', 'LRCC', 8, 285, 220, 58, 12, 28.0, 215, 3, 35.63, 129.55, 7.68, NOW()),
('tp_002', 'trn_001', 'tt_001', 'plr_002', 'David Williams', 'LRCC', 8, 380, 295, 68, 0, 0, 0, 5, 47.50, 128.81, 0, NOW()),
('tp_003', 'trn_001', 'tt_001', 'plr_003', 'James Brown', 'LRCC', 8, 195, 165, 45, 0, 0, 0, 8, 24.38, 118.18, 0, NOW()),
('tp_004', 'trn_001', 'tt_001', 'plr_004', 'Robert Davis', 'LRCC', 8, 125, 98, 42, 18, 32.0, 240, 2, 15.63, 127.55, 7.50, NOW());

-- ============================================================================
-- MATCH STATE (For live scoring)
-- ============================================================================
INSERT INTO "MatchState" (id, match_id, innings, striker, non_striker, bowler, toss_winner, toss_decision, batting_first, created_date) VALUES
('ms_001', 'mtch_001', 2, 'David Williams', 'Mike Johnson', 'Opposition Bowler 1', 'home', 'bat', 'home', NOW());

-- ============================================================================
-- INNINGS SCORES
-- ============================================================================
INSERT INTO "InningsScore" (id, match_id, innings, batting_team_name, bowling_team_name, total_runs, total_wickets, total_overs, extras_wide, extras_no_ball, extras_bye, extras_leg_bye, run_rate, is_completed, created_date) VALUES
('is_001', 'mtch_001', 1, 'LRCC', 'Birmingham Hawks', 165, 7, '20.0', 8, 3, 2, 1, 8.25, true, NOW()),
('is_002', 'mtch_001', 2, 'Birmingham Hawks', 'LRCC', 158, 8, '20.0', 6, 2, 3, 2, 7.90, true, NOW());

-- ============================================================================
-- BALL BY BALL DATA (Sample for first over)
-- ============================================================================
INSERT INTO "BallByBall" (id, match_id, innings, over_number, ball_number, batsman_name, non_striker_name, bowler_name, runs, extras, extra_type, is_wicket, is_four, is_six, is_dot, created_date) VALUES
('bb_001', 'mtch_001', 1, 1, 1, 'Mike Johnson', 'David Williams', 'Opposition Bowler 1', 0, 0, '', false, false, false, true, NOW()),
('bb_002', 'mtch_001', 1, 1, 2, 'Mike Johnson', 'David Williams', 'Opposition Bowler 1', 4, 0, '', false, true, false, false, NOW()),
('bb_003', 'mtch_001', 1, 1, 3, 'Mike Johnson', 'David Williams', 'Opposition Bowler 1', 1, 0, '', false, false, false, false, NOW()),
('bb_004', 'mtch_001', 1, 1, 4, 'David Williams', 'Mike Johnson', 'Opposition Bowler 1', 0, 0, '', false, false, false, true, NOW()),
('bb_005', 'mtch_001', 1, 1, 5, 'David Williams', 'Mike Johnson', 'Opposition Bowler 1', 2, 0, '', false, false, false, false, NOW()),
('bb_006', 'mtch_001', 1, 1, 6, 'David Williams', 'Mike Johnson', 'Opposition Bowler 1', 6, 0, '', false, false, true, false, NOW());

-- ============================================================================
-- CUSTOM STREAM OVERLAYS
-- ============================================================================
INSERT INTO "CustomStreamOverlay" (id, name, layout_type, theme, sponsor_url, is_default, created_date, created_by) VALUES
('cso_001', 'Default Full Overlay', 'full', 'default', NULL, true, NOW(), 'usr_001'),
('cso_002', 'Minimal Corner Overlay', 'minimal', 'dark', NULL, false, NOW(), 'usr_001'),
('cso_003', 'Ticker Overlay', 'ticker', 'light', NULL, false, NOW(), 'usr_001');

-- ============================================================================
-- USER NOTIFICATIONS
-- ============================================================================
INSERT INTO "UserNotification" (id, user_id, notification_id, is_read, read_at, created_date) VALUES
('un_001', 'usr_001', 'ntf_001', true, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 day'),
('un_002', 'usr_002', 'ntf_001', false, NULL, NOW() - INTERVAL '1 day'),
('un_003', 'usr_001', 'ntf_002', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
('un_004', 'usr_003', 'ntf_002', false, NULL, NOW() - INTERVAL '2 days');

-- ============================================================================
-- CONTACT MESSAGES
-- ============================================================================
INSERT INTO "ContactMessage" (id, name, email, phone, subject, message, status, created_date) VALUES
('cm_001', 'Sarah Thompson', 'sarah@example.com', '07700123456', 'Membership Inquiry', 'I would like to know more about joining the club for the upcoming season.', 'New', NOW() - INTERVAL '2 days'),
('cm_002', 'Mark Wilson', 'mark@example.com', '07700234567', 'Sponsorship Opportunity', 'Our company is interested in sponsoring the club. Please contact us.', 'Responded', NOW() - INTERVAL '5 days');

-- ============================================================================
-- CLUB STATS
-- ============================================================================
INSERT INTO "ClubStats" (id, season, total_matches, matches_won, matches_lost, total_runs, total_wickets, top_scorer_name, top_scorer_runs, top_bowler_name, top_bowler_wickets, created_date) VALUES
('stat_001', '2024-2025', 8, 5, 3, 1250, 45, 'David Williams', 380, 'Robert Davis', 18, NOW()),
('stat_002', '2023-2024', 18, 12, 6, 2850, 98, 'Mike Johnson', 645, 'Robert Davis', 32, NOW());

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Data insertion completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Users: 8';
    RAISE NOTICE '- Teams: 5';
    RAISE NOTICE '- Players: 8';
    RAISE NOTICE '- Seasons: 2';
    RAISE NOTICE '- Competitions: 4';
    RAISE NOTICE '- Tournaments: 3';
    RAISE NOTICE '- Matches: 6';
    RAISE NOTICE '- News Articles: 4';
    RAISE NOTICE '- Events: 3';
    RAISE NOTICE '- Gallery Images: 5';
    RAISE NOTICE '- Memberships: 5';
    RAISE NOTICE '- Player Charges: 5';
    RAISE NOTICE '- Player Payments: 4';
    RAISE NOTICE '- Match Availability: 6';
    RAISE NOTICE '- Notifications: 3';
    RAISE NOTICE '- Finance Categories: 8';
    RAISE NOTICE '- Transactions: 5';
    RAISE NOTICE '- Sponsors: 3';
    RAISE NOTICE '- Event RSVPs: 5';
    RAISE NOTICE '- Match Profiles: 3';
    RAISE NOTICE '- Tournament Players: 4';
    RAISE NOTICE '- Match States: 1';
    RAISE NOTICE '- Innings Scores: 2';
    RAISE NOTICE '- Ball by Ball: 6';
    RAISE NOTICE '- Custom Overlays: 3';
    RAISE NOTICE '- User Notifications: 4';
    RAISE NOTICE '- Contact Messages: 2';
    RAISE NOTICE '- Club Stats: 2';
    RAISE NOTICE '========================================';
END $$;