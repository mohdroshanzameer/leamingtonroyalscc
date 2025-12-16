// backend/utils/sqlSafe.js
const { DB_TABLES, DB_COLUMNS } = require("../db/pool");

/**
 * Convert "TeamPlayer" -> "team_player"
 */
function pascalToSnake(str = "") {
  return String(str)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

function normalizeEntityKey(input = "") {
  // Normalize: "TeamPlayer", "team-player", "team_player", "TEAMPLAYER" -> "teamplayer"
  return String(input).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

/**
 * IMPORTANT:
 * Use an allowlist mapping so frontend entity names map to exact postgres tables.
 * Table names here are based on schema.sql.
 */
const ENTITY_TABLE_MAP = {
  User: "users",
  Season: "seasons",
  SponsorPayment: "sponsor_payments",
  Sponsor: "sponsors",
  SponsoTyper: "sponsor_type",
  Team: "teams",
  TeamPlayer: "team_players",
  Tournament: "tournaments",
  TournamentMatch: "tournament_matches",
  TournamentTeam: "tournament_teams",
  TournamentPlayer: "tournament_players",
  MatchState: "match_state",
  MatchProfile: "match_profiles",
  Competition: "competitions",
  Transaction: "transactions",
  FinanceCategory: "finance_categories",
  Invoice: "invoices",
  Membership: "memberships",
  Event: "events",
  EventRSVP: "event_rsvp",
  GalleryImage: "gallery_images",
  News: "news",
  Notification: "notifications",
  ContactMessage: "contact_messages",
  CustomStreamOverlay: "custom_stream_overlays",
  InningsScore: "innings_score",
  BallByBall: "ball_by_ball",
  MatchAvailability: "match_availability",
  PaymentAllocation: "payment_allocations",
  PaymentAuditLog: "payment_audit_logs",
  PaymentSettings: "payment_settings",
  PlayerCharge: "player_charges",
  PlayerPayment: "player_payments",
  RefreshToken: "refresh_tokens",
  ClubStat: "club_stats",
  SystemLog: "system_logs",
  UserActivityLog: "user_activity_logs",
  UserNotification: "user_notifications",
  ImageSetting:"image_settings",
};

// Build fast lookup by normalized key
const ENTITY_TABLE_LOOKUP = new Map(
  Object.entries(ENTITY_TABLE_MAP).map(([k, v]) => [normalizeEntityKey(k), v])
);

/**
 * Resolve a request like /entities/User or /entities/team_players to an actual table.
 * - Accepts entity class names (User) and raw table names (users)
 * - Only returns tables that exist in DB_TABLES allowlist
 */
function resolveTable(entityName) {
  if (!entityName) return null;

  // 1) If they already passed a real table name:
  const raw = String(entityName).toLowerCase();
  if (DB_TABLES?.has(raw)) return raw;

  // 2) Allow mapped entity names:
  const mapped = ENTITY_TABLE_LOOKUP.get(normalizeEntityKey(entityName));
  if (mapped && DB_TABLES?.has(mapped)) return mapped;

  // 3) Fallback: try snake version (but still require allowlist)
  const snake = pascalToSnake(entityName);
  if (DB_TABLES?.has(snake)) return snake;

  return null;
}

function resolveOrderBy(tableName, sortParam) {
  if (!sortParam) return null;
  const cols = DB_COLUMNS.get(tableName);
  if (!cols) return null;

  const s = String(sortParam);
  const desc = s.startsWith("-");
  const col = desc ? s.slice(1) : s;

  if (!cols.has(col)) return null;
  return { col, desc };
}

module.exports = { quoteIdent, resolveTable, resolveOrderBy };
