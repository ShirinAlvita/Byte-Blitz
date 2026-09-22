const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'csm.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('cache_size = -64000');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('superadmin','admin','judge','team')),
    team_id TEXT,
    name TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    members TEXT NOT NULL DEFAULT '[]',
    capital INTEGER NOT NULL DEFAULT 10000,
    starting_capital INTEGER NOT NULL DEFAULT 10000,
    total_rewards INTEGER NOT NULL DEFAULT 0,
    solved INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    category TEXT NOT NULL,
    investment INTEGER NOT NULL,
    base_reward INTEGER NOT NULL,
    hacker_rank_url TEXT NOT NULL,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    problem_id TEXT NOT NULL,
    investment_amount INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','passed','failed')),
    pending_verification INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id)
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    investment_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    problem_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('PASS','FAIL')),
    result_code TEXT UNIQUE NOT NULL,
    verified_by TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
    FOREIGN KEY (investment_id) REFERENCES investments(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    problem_id TEXT,
    balance_after INTEGER NOT NULL,
    performed_by TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS market_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    multiplier REAL NOT NULL,
    targets TEXT NOT NULL,
    target_value TEXT,
    active INTEGER NOT NULL DEFAULT 0,
    start_time INTEGER,
    end_time INTEGER,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    expiry_minutes INTEGER,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    admin_id TEXT,
    admin_role TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS activity_feed (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS event_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS result_codes (
    code TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_investments_team ON investments(team_id);
  CREATE INDEX IF NOT EXISTS idx_investments_problem ON investments(problem_id);
  CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
  CREATE INDEX IF NOT EXISTS idx_attempts_investment ON attempts(investment_id);
  CREATE INDEX IF NOT EXISTS idx_attempts_team ON attempts(team_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_team ON transactions(team_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at);
  CREATE INDEX IF NOT EXISTS idx_teams_capital ON teams(capital DESC);
`);

module.exports = db;
