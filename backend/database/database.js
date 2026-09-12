const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

// ==========================================
// DATABASE CONNECTION
// ==========================================

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, "life-rpg.db");

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

// Keep a per-installation signing key when one is not supplied through the
// environment.  The old hard-coded fallback allowed anyone to forge tokens.
db.prepare(`
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`).run();

const configuredJwtSecret = process.env.JWT_SECRET;
let jwtSecret = configuredJwtSecret;

if (!jwtSecret) {
  const storedSecret = db
    .prepare("SELECT value FROM app_settings WHERE key = ?")
    .get("jwt_secret");

  if (storedSecret) {
    jwtSecret = storedSecret.value;
  } else {
    jwtSecret = crypto.randomBytes(32).toString("hex");
    db.prepare(`
      INSERT INTO app_settings (key, value)
      VALUES (?, ?)
    `).run("jwt_secret", jwtSecret);
  }
}

db.jwtSecret = jwtSecret;

// ==========================================
// USERS TABLE
// ==========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    gold INTEGER NOT NULL DEFAULT 100,
    streak INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// ==========================================
// QUESTS TABLE
// ==========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Discipline',
    xp_reward INTEGER NOT NULL DEFAULT 50,
    gold_reward INTEGER NOT NULL DEFAULT 10,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  )
`).run();

// ==========================================
// QUEST MIGRATION
// Add recurring quest support to old database
// ==========================================

const questColumns = db
  .prepare("PRAGMA table_info(quests)")
  .all();

const hasRecurringColumn = questColumns.some(
  (column) => column.name === "recurring"
);

if (!hasRecurringColumn) {
  db.prepare(`
    ALTER TABLE quests
    ADD COLUMN recurring INTEGER NOT NULL DEFAULT 0
  `).run();

  console.log("Added recurring column to quests table.");
}

// ==========================================
// CHARACTER ATTRIBUTES TABLE
// ==========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    strength INTEGER NOT NULL DEFAULT 1,
    intellect INTEGER NOT NULL DEFAULT 1,
    vitality INTEGER NOT NULL DEFAULT 1,
    discipline INTEGER NOT NULL DEFAULT 1,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  )
`).run();

// Backfill attributes for accounts created before this table was introduced.
db.prepare(`
  INSERT OR IGNORE INTO attributes (user_id)
  SELECT id FROM users
`).run();

// ==========================================
// REWARDS TABLE
// ==========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    icon TEXT DEFAULT '🎁',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// ==========================================
// USER INVENTORY TABLE
// ==========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS user_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reward_id INTEGER NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    FOREIGN KEY (reward_id)
      REFERENCES rewards(id)
      ON DELETE CASCADE
  )
`).run();

// ==========================================
// QUEST COMPLETION HISTORY
// ==========================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS quest_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    quest_id INTEGER,
    quest_title TEXT NOT NULL,
    quest_category TEXT NOT NULL,
    xp_reward INTEGER NOT NULL,
    gold_reward INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    FOREIGN KEY (quest_id)
      REFERENCES quests(id)
      ON DELETE SET NULL
  )
`).run();

// Preserve completion history when a quest is deleted. Older databases used
// ON DELETE CASCADE and would silently remove the user's history as well.
const questLogForeignKey = db
  .prepare("PRAGMA foreign_key_list(quest_logs)")
  .all()
  .find((foreignKey) => foreignKey.from === "quest_id");

if (questLogForeignKey && questLogForeignKey.on_delete === "CASCADE") {
  db.pragma("foreign_keys = OFF");
  db.exec(`
    CREATE TABLE quest_logs_migrated (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quest_id INTEGER,
      quest_title TEXT NOT NULL,
      quest_category TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      gold_reward INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE SET NULL
    );

    INSERT INTO quest_logs_migrated (
      id,
      user_id,
      quest_id,
      quest_title,
      quest_category,
      xp_reward,
      gold_reward,
      completed_at
    )
    SELECT
      logs.id,
      logs.user_id,
      logs.quest_id,
      quests.title,
      quests.category,
      quests.xp_reward,
      quests.gold_reward,
      logs.completed_at
    FROM quest_logs AS logs
    INNER JOIN quests ON quests.id = logs.quest_id;

    DROP TABLE quest_logs;
    ALTER TABLE quest_logs_migrated RENAME TO quest_logs;
  `);
  db.pragma("foreign_keys = ON");
  console.log("Migrated quest history to preserve deleted quests.");
}

// ==========================================
// INDEXES
// ==========================================

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email)
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_quests_user_id
  ON quests(user_id)
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_quests_completed
  ON quests(user_id, completed)
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id
  ON user_rewards(user_id)
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_quest_logs_user_id
  ON quest_logs(user_id)
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_quest_logs_completed_at
  ON quest_logs(user_id, completed_at)
`).run();

// ==========================================
// DEFAULT REWARDS
// ==========================================

const rewardCount = db
  .prepare("SELECT COUNT(*) AS count FROM rewards")
  .get();

if (rewardCount.count === 0) {

  const insertReward = db.prepare(`
    INSERT INTO rewards (
      name,
      description,
      cost,
      icon
    )
    VALUES (?, ?, ?, ?)
  `);

  insertReward.run(
    "Focus Potion",
    "A virtual reward for completing focused work.",
    50,
    "🧪"
  );

  insertReward.run(
    "Warrior Badge",
    "A badge earned by disciplined heroes.",
    100,
    "⚔️"
  );

  insertReward.run(
    "Golden Crown",
    "A premium virtual item for elite heroes.",
    250,
    "👑"
  );

  insertReward.run(
    "Epic Chest",
    "A mysterious chest for your RPG inventory.",
    500,
    "🎁"
  );
}

// ==========================================
// DATABASE READY
// ==========================================

console.log("SQLite database initialized successfully.");

module.exports = db;