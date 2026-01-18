const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'cowork.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  -- Goals table
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Connections table
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('google_docs', 'google_drive', 'gmail', 'jira', 'mysql', 'confluence')),
    name TEXT NOT NULL,
    config TEXT NOT NULL, -- JSON configuration
    status TEXT DEFAULT 'connected' CHECK(status IN ('connected', 'disconnected', 'error')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
  );

  -- Files/Content table (for individual files from Google Docs)
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    name TEXT NOT NULL,
    file_type TEXT,
    external_id TEXT, -- ID in external system (Google Doc ID, etc.)
    content TEXT, -- Cached content for analysis
    metadata TEXT, -- JSON metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
  );

  -- Actions/Suggestions table
  CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    connection_id TEXT,
    file_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    action_type TEXT NOT NULL,
    action_config TEXT, -- JSON config for the action
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE SET NULL,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
  );

  -- Dashboard widgets table
  CREATE TABLE IF NOT EXISTS widgets (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    file_id TEXT,
    widget_type TEXT NOT NULL CHECK(widget_type IN ('summary', 'key_points', 'chart', 'custom')),
    title TEXT NOT NULL,
    content TEXT, -- The generated content (summary, etc.)
    config TEXT, -- JSON config
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
  );
`);

module.exports = db;
