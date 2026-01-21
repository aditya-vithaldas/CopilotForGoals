const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'cowork.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    google_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Sessions table
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Goals table
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Connections table
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    user_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('google_docs', 'google_drive', 'gmail', 'jira', 'mysql', 'confluence', 'whatsapp')),
    name TEXT NOT NULL,
    config TEXT NOT NULL, -- JSON configuration
    status TEXT DEFAULT 'connected' CHECK(status IN ('connected', 'disconnected', 'error')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

  -- Todos table
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    source TEXT, -- where this todo came from (e.g., widget title)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
  );
`);

module.exports = db;
