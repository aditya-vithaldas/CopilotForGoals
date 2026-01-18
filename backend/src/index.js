require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const gemini = require('./gemini');

// Import connectors (each is standalone and can be unit tested independently)
const { googleAuth, googleDrive, googleDocs, gmail, jira } = require('./connectors');

// Backward compatibility wrapper for google module
const google = {
  getAuthUrl: googleAuth.getAuthUrl,
  getTokens: googleAuth.getTokens,
  getAuthenticatedClient: googleAuth.getAuthenticatedClient,
  getUserInfo: googleAuth.getUserInfo,
  listDriveFiles: googleDrive.listFiles,
  listDriveFolders: googleDrive.listFolders,
  getFileMetadata: googleDrive.getFileMetadata,
  getDocContent: googleDocs.getDocumentContent,
  searchDriveFiles: googleDrive.searchFiles,
  exportFile: googleDrive.exportFile,
  listEmails: (tokens, maxResults, query) => gmail.listMessages(tokens, { maxResults, query }).then(r => r.messages),
  getEmail: gmail.getMessage,
  searchEmails: (tokens, query, maxResults) => gmail.searchMessages(tokens, query, { maxResults }).then(r => r.messages),
  getLabels: gmail.getLabels,
};

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============== GOALS API ==============

// Get all goals
app.get('/api/goals', (req, res) => {
  try {
    const goals = db.prepare(`
      SELECT g.*,
        (SELECT COUNT(*) FROM connections WHERE goal_id = g.id) as connection_count,
        (SELECT COUNT(*) FROM files WHERE goal_id = g.id) as file_count
      FROM goals g
      ORDER BY g.updated_at DESC
    `).all();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single goal with connections
app.get('/api/goals/:id', (req, res) => {
  try {
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const connections = db.prepare('SELECT * FROM connections WHERE goal_id = ?').all(req.params.id);
    const files = db.prepare('SELECT * FROM files WHERE goal_id = ?').all(req.params.id);
    const suggestions = db.prepare('SELECT * FROM suggestions WHERE goal_id = ?').all(req.params.id);

    res.json({
      ...goal,
      connections: connections.map(c => ({ ...c, config: JSON.parse(c.config || '{}') })),
      files: files.map(f => ({ ...f, metadata: JSON.parse(f.metadata || '{}') })),
      suggestions: suggestions.map(s => ({ ...s, action_config: JSON.parse(s.action_config || '{}') }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create goal
app.post('/api/goals', (req, res) => {
  try {
    const { name, description } = req.body;
    const id = uuidv4();

    db.prepare('INSERT INTO goals (id, name, description) VALUES (?, ?, ?)').run(id, name, description || '');

    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update goal
app.put('/api/goals/:id', (req, res) => {
  try {
    const { name, description } = req.body;

    db.prepare('UPDATE goals SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, description || '', req.params.id);

    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete goal
app.delete('/api/goals/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== CONNECTIONS API ==============

// Get connections for a goal
app.get('/api/goals/:goalId/connections', (req, res) => {
  try {
    const connections = db.prepare('SELECT * FROM connections WHERE goal_id = ?').all(req.params.goalId);
    res.json(connections.map(c => ({ ...c, config: JSON.parse(c.config || '{}') })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add connection
app.post('/api/goals/:goalId/connections', (req, res) => {
  try {
    const { type, name, config } = req.body;
    const id = uuidv4();

    db.prepare('INSERT INTO connections (id, goal_id, type, name, config) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.params.goalId, type, name, JSON.stringify(config || {}));

    // Update goal timestamp
    db.prepare('UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.goalId);

    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(id);
    res.status(201).json({ ...connection, config: JSON.parse(connection.config) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update connection
app.put('/api/connections/:id', (req, res) => {
  try {
    const { name, config, status } = req.body;

    db.prepare('UPDATE connections SET name = ?, config = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, JSON.stringify(config || {}), status || 'connected', req.params.id);

    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id);
    res.json({ ...connection, config: JSON.parse(connection.config) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete connection
app.delete('/api/connections/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM connections WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== FILES API ==============

// Add file to connection
app.post('/api/connections/:connectionId/files', (req, res) => {
  try {
    const { name, file_type, external_id, content, metadata } = req.body;
    const id = uuidv4();

    // Get goal_id from connection
    const connection = db.prepare('SELECT goal_id FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    db.prepare('INSERT INTO files (id, connection_id, goal_id, name, file_type, external_id, content, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.params.connectionId, connection.goal_id, name, file_type || '', external_id || '', content || '', JSON.stringify(metadata || {}));

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    res.status(201).json({ ...file, metadata: JSON.parse(file.metadata || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get files for a connection
app.get('/api/connections/:connectionId/files', (req, res) => {
  try {
    const files = db.prepare('SELECT * FROM files WHERE connection_id = ?').all(req.params.connectionId);
    res.json(files.map(f => ({ ...f, metadata: JSON.parse(f.metadata || '{}') })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete('/api/files/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== SUGGESTIONS API ==============

// Add suggestion
app.post('/api/goals/:goalId/suggestions', (req, res) => {
  try {
    const { connection_id, file_id, title, description, action_type, action_config } = req.body;
    const id = uuidv4();

    db.prepare('INSERT INTO suggestions (id, goal_id, connection_id, file_id, title, description, action_type, action_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.params.goalId, connection_id || null, file_id || null, title, description || '', action_type, JSON.stringify(action_config || {}));

    const suggestion = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(id);
    res.status(201).json({ ...suggestion, action_config: JSON.parse(suggestion.action_config || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get suggestions for a goal
app.get('/api/goals/:goalId/suggestions', (req, res) => {
  try {
    const suggestions = db.prepare('SELECT * FROM suggestions WHERE goal_id = ?').all(req.params.goalId);
    res.json(suggestions.map(s => ({ ...s, action_config: JSON.parse(s.action_config || '{}') })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete suggestion
app.delete('/api/suggestions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM suggestions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== GENERATE SUGGESTIONS ==============

// Generate suggestions based on connection type and content
app.post('/api/goals/:goalId/generate-suggestions', (req, res) => {
  try {
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const connections = db.prepare('SELECT * FROM connections WHERE goal_id = ?').all(req.params.goalId);
    const files = db.prepare('SELECT * FROM files WHERE goal_id = ?').all(req.params.goalId);

    // Clear existing suggestions
    db.prepare('DELETE FROM suggestions WHERE goal_id = ?').run(req.params.goalId);

    const suggestions = [];

    // Generate suggestions based on connection types
    for (const conn of connections) {
      const config = JSON.parse(conn.config || '{}');

      switch (conn.type) {
        case 'jira':
          suggestions.push({
            connection_id: conn.id,
            title: 'View Kanban Board',
            description: `View the Kanban board for ${config.boardName || 'this project'}`,
            action_type: 'view_kanban',
            action_config: { boardId: config.boardId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Show Project Plan',
            description: 'View the project timeline and sprint planning',
            action_type: 'view_project_plan',
            action_config: { boardId: config.boardId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Active Sprint',
            description: 'See current sprint tickets and progress',
            action_type: 'view_sprint',
            action_config: { boardId: config.boardId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Track Sprint Progress',
            description: 'Monitor burndown and team velocity',
            action_type: 'view_sprint',
            action_config: { boardId: config.boardId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Epics & Roadmap',
            description: 'See high-level project epics and their status',
            action_type: 'view_project_plan',
            action_config: { boardId: config.boardId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Recent Activity',
            description: 'View recently updated tickets',
            action_type: 'view_project_plan',
            action_config: { boardId: config.boardId }
          });
          break;

        case 'gmail':
          suggestions.push({
            connection_id: conn.id,
            title: 'View Inbox',
            description: 'Browse your recent emails',
            action_type: 'view_inbox',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Search Emails',
            description: 'Search across all your messages',
            action_type: 'search_emails',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Unread Messages',
            description: 'View emails you haven\'t read yet',
            action_type: 'view_unread',
            action_config: { query: 'is:unread' }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Starred Messages',
            description: 'View your important starred emails',
            action_type: 'view_starred',
            action_config: { query: 'is:starred' }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Recent Threads',
            description: 'View your most recent conversations',
            action_type: 'view_recent',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Emails with Attachments',
            description: 'Find emails that have file attachments',
            action_type: 'view_attachments',
            action_config: { query: 'has:attachment' }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Emails by Label',
            description: 'Browse emails from a specific label and add to dashboard',
            action_type: 'view_by_label',
            action_config: {}
          });
          break;

        case 'whatsapp':
          suggestions.push({
            connection_id: conn.id,
            title: 'View Recent Chats',
            description: 'Browse your recent WhatsApp conversations',
            action_type: 'view_chats',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Search Messages',
            description: 'Search across all your WhatsApp messages',
            action_type: 'search_messages',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Group Chats',
            description: 'Browse messages from your WhatsApp groups',
            action_type: 'view_groups',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Export Chat Summary',
            description: 'Get a summary of key messages and action items',
            action_type: 'chat_summary',
            action_config: {}
          });
          break;

        case 'mysql':
          suggestions.push({
            connection_id: conn.id,
            title: 'Create Dashboard View',
            description: 'Build a visual dashboard from your database tables',
            action_type: 'create_dashboard',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Generate Data Report',
            description: 'Create a searchable report from your data',
            action_type: 'generate_report',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Query with Natural Language',
            description: 'Search your database using plain text queries',
            action_type: 'natural_query',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Table Schema',
            description: 'Explore your database structure',
            action_type: 'view_schema',
            action_config: {}
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Export Data',
            description: 'Export query results to CSV or JSON',
            action_type: 'export_data',
            action_config: {}
          });
          break;

        case 'google_drive':
          suggestions.push({
            connection_id: conn.id,
            title: 'Browse Folder Contents',
            description: `View all files in ${config.folderName || 'the connected folder'}`,
            action_type: 'browse_folder',
            action_config: { folderId: config.folderId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Search Files',
            description: 'Search across all files in this folder',
            action_type: 'search_files',
            action_config: { folderId: config.folderId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Recent Files',
            description: 'View recently modified documents',
            action_type: 'recent_files',
            action_config: { folderId: config.folderId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Import Documents',
            description: 'Add Drive documents to this goal',
            action_type: 'import_files',
            action_config: { folderId: config.folderId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Spreadsheets',
            description: 'Browse Google Sheets in this folder',
            action_type: 'view_sheets',
            action_config: { folderId: config.folderId }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Presentations',
            description: 'Browse Google Slides in this folder',
            action_type: 'view_slides',
            action_config: { folderId: config.folderId }
          });
          break;

        case 'confluence':
          suggestions.push({
            connection_id: conn.id,
            title: 'Browse Wiki Pages',
            description: `View pages in ${config.spaceName || 'the connected space'}`,
            action_type: 'browse_wiki',
            action_config: { spaceKey: config.spaceKey }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Search Documentation',
            description: 'Search across all wiki pages',
            action_type: 'search_wiki',
            action_config: { spaceKey: config.spaceKey }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Recent Updates',
            description: 'See recently modified pages',
            action_type: 'recent_updates',
            action_config: { spaceKey: config.spaceKey }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Page Tree',
            description: 'Navigate the page hierarchy',
            action_type: 'view_tree',
            action_config: { spaceKey: config.spaceKey }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'Find Attachments',
            description: 'Search for files attached to pages',
            action_type: 'find_attachments',
            action_config: { spaceKey: config.spaceKey }
          });
          suggestions.push({
            connection_id: conn.id,
            title: 'View Labels',
            description: 'Browse pages by label/tag',
            action_type: 'view_labels',
            action_config: { spaceKey: config.spaceKey }
          });
          break;

        case 'google_docs':
          // Suggestions are file-specific for Google Docs
          break;
      }
    }

    // Generate suggestions based on files
    for (const file of files) {
      const metadata = JSON.parse(file.metadata || '{}');

      if (file.file_type === 'document' || file.file_type === 'google_doc') {
        suggestions.push({
          file_id: file.id,
          connection_id: file.connection_id,
          title: 'Summarize Document',
          description: `Get a summary of "${file.name}"`,
          action_type: 'summarize',
          action_config: { fileId: file.id }
        });
        suggestions.push({
          file_id: file.id,
          connection_id: file.connection_id,
          title: 'Extract Key Points',
          description: `Extract action items and key points from "${file.name}"`,
          action_type: 'extract_points',
          action_config: { fileId: file.id }
        });
      }

      if (file.file_type === 'spreadsheet') {
        suggestions.push({
          file_id: file.id,
          connection_id: file.connection_id,
          title: 'Visualize Data',
          description: `Create charts from "${file.name}"`,
          action_type: 'visualize',
          action_config: { fileId: file.id }
        });
        suggestions.push({
          file_id: file.id,
          connection_id: file.connection_id,
          title: 'Generate Insights',
          description: `Analyze trends in "${file.name}"`,
          action_type: 'analyze_data',
          action_config: { fileId: file.id }
        });
      }
    }

    // Insert suggestions
    const insertStmt = db.prepare('INSERT INTO suggestions (id, goal_id, connection_id, file_id, title, description, action_type, action_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    for (const s of suggestions) {
      const id = uuidv4();
      insertStmt.run(
        id,
        req.params.goalId,
        s.connection_id || null,
        s.file_id || null,
        s.title,
        s.description,
        s.action_type,
        JSON.stringify(s.action_config)
      );
    }

    const savedSuggestions = db.prepare('SELECT * FROM suggestions WHERE goal_id = ?').all(req.params.goalId);
    res.json(savedSuggestions.map(s => ({ ...s, action_config: JSON.parse(s.action_config || '{}') })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== GOOGLE AUTH API ==============

// Start Google OAuth flow
app.get('/api/auth/google', (req, res) => {
  const { goalId, connectionType } = req.query;
  const state = JSON.stringify({ goalId, connectionType });
  const authUrl = google.getAuthUrl(state);
  res.json({ authUrl });
});

// Google OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { goalId, connectionType } = JSON.parse(state || '{}');

    // Exchange code for tokens
    const tokens = await google.getTokens(code);

    // Get user info
    const userInfo = await google.getUserInfo(tokens);

    // Create connection with tokens stored
    const connectionId = uuidv4();
    const connectionName = `Google (${userInfo.email})`;
    const config = {
      email: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    };

    db.prepare('INSERT INTO connections (id, goal_id, type, name, config) VALUES (?, ?, ?, ?, ?)')
      .run(connectionId, goalId, connectionType, connectionName, JSON.stringify(config));

    // Update goal timestamp
    db.prepare('UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(goalId);

    // Redirect back to frontend
    res.redirect(`http://localhost:5174/goals/${goalId}?connected=${connectionType}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`http://localhost:5174/goals/${req.query.state ? JSON.parse(req.query.state).goalId : ''}?error=auth_failed`);
  }
});

// ============== GOOGLE DRIVE API ==============

// List files in Drive
app.get('/api/connections/:connectionId/drive/files', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');
    const { folderId } = req.query;

    const tokens = {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    };

    const result = await google.listDriveFiles(tokens, folderId || config.folderId);
    res.json(result);
  } catch (error) {
    console.error('Drive files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List folders for picker
app.get('/api/connections/:connectionId/drive/folders', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');
    const { parentId } = req.query;

    const tokens = {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    };

    const folders = await google.listDriveFolders(tokens, parentId || 'root');
    res.json(folders);
  } catch (error) {
    console.error('Drive folders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search files
app.get('/api/connections/:connectionId/drive/search', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');
    const { query, folderId } = req.query;

    const tokens = {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    };

    const files = await google.searchDriveFiles(tokens, query, folderId || config.folderId);
    res.json(files);
  } catch (error) {
    console.error('Drive search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set folder for connection
app.put('/api/connections/:connectionId/drive/folder', async (req, res) => {
  try {
    const { folderId, folderName } = req.body;
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');
    config.folderId = folderId;
    config.folderName = folderName;

    db.prepare('UPDATE connections SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(config), req.params.connectionId);

    res.json({ success: true });
  } catch (error) {
    console.error('Set folder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== GOOGLE DOCS API ==============

// Get document content
app.get('/api/connections/:connectionId/docs/:documentId', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');
    const tokens = {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    };

    const doc = await google.getDocContent(tokens, req.params.documentId);
    res.json(doc);
  } catch (error) {
    console.error('Get doc error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import file to goal
app.post('/api/connections/:connectionId/import', async (req, res) => {
  try {
    const { fileId, fileName, mimeType } = req.body;
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');
    const tokens = {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    };

    let content = '';
    let fileType = 'document';

    // Get content based on file type
    if (mimeType === 'application/vnd.google-apps.document') {
      const doc = await google.getDocContent(tokens, fileId);
      content = doc.content;
      fileType = 'google_doc';
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      fileType = 'spreadsheet';
      // For spreadsheets, we'd export as CSV
      content = await google.exportFile(tokens, fileId, 'text/csv');
    }

    // Save to files table
    const id = uuidv4();
    db.prepare('INSERT INTO files (id, connection_id, goal_id, name, file_type, external_id, content, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, connection.id, connection.goal_id, fileName, fileType, fileId, content, JSON.stringify({ mimeType }));

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    res.status(201).json({ ...file, metadata: JSON.parse(file.metadata || '{}') });
  } catch (error) {
    console.error('Import file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== GMAIL API ==============

// List emails
app.get('/api/connections/:connectionId/gmail/messages', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');
    const { query, maxResults } = req.query;

    const tokens = {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    };

    const emails = await google.listEmails(tokens, parseInt(maxResults) || 20, query || '');
    res.json(emails);
  } catch (error) {
    console.error('Gmail list error:', error);
    // Check for insufficient scopes error
    if (error.message && error.message.includes('insufficient authentication scopes')) {
      return res.status(403).json({
        error: 'Gmail access not authorized. Please reconnect your Google account with Gmail permissions.',
        code: 'INSUFFICIENT_SCOPES'
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get single email
app.get('/api/connections/:connectionId/gmail/messages/:messageId', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');

    const tokens = {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    };

    const email = await google.getEmail(tokens, req.params.messageId);
    res.json(email);
  } catch (error) {
    console.error('Gmail get error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search emails
app.get('/api/connections/:connectionId/gmail/search', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');
    const { query, maxResults } = req.query;

    const tokens = {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    };

    const emails = await google.searchEmails(tokens, query || '', parseInt(maxResults) || 20);
    res.json(emails);
  } catch (error) {
    console.error('Gmail search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Gmail labels
app.get('/api/connections/:connectionId/gmail/labels', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');

    const tokens = {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    };

    const labels = await google.getLabels(tokens);
    res.json(labels);
  } catch (error) {
    console.error('Gmail labels error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== JIRA API ==============

// Test Jira connection
app.post('/api/jira/test', async (req, res) => {
  try {
    const { jiraUrl, email, apiToken } = req.body;
    const result = await jira.testConnection(jiraUrl, email, apiToken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available boards
app.post('/api/jira/boards', async (req, res) => {
  try {
    const { jiraUrl, email, apiToken } = req.body;
    const boards = await jira.getBoards(jiraUrl, email, apiToken);
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get board issues (Kanban view)
app.get('/api/connections/:connectionId/jira/issues', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    const config = JSON.parse(connection.config || '{}');
    const issues = await jira.getBoardIssues(config.jiraUrl, config.email, config.apiToken, config.boardId);
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get board configuration (columns)
app.get('/api/connections/:connectionId/jira/config', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    const config = JSON.parse(connection.config || '{}');
    const boardConfig = await jira.getBoardConfiguration(config.jiraUrl, config.email, config.apiToken, config.boardId);
    res.json(boardConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active sprint
app.get('/api/connections/:connectionId/jira/sprint', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    const config = JSON.parse(connection.config || '{}');
    const sprint = await jira.getActiveSprint(config.jiraUrl, config.email, config.apiToken, config.boardId);
    if (sprint) {
      const issues = await jira.getSprintIssues(config.jiraUrl, config.email, config.apiToken, sprint.id);
      res.json({ sprint, issues });
    } else {
      res.json({ sprint: null, issues: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get epics/roadmap
app.get('/api/connections/:connectionId/jira/epics', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    const config = JSON.parse(connection.config || '{}');
    const epics = await jira.getEpics(config.jiraUrl, config.email, config.apiToken, config.boardId);
    res.json(epics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent tickets
app.get('/api/connections/:connectionId/jira/recent', async (req, res) => {
  try {
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    const config = JSON.parse(connection.config || '{}');
    const tickets = await jira.getRecentTickets(config.jiraUrl, config.email, config.apiToken, config.boardId, 4);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set board for Jira connection
app.put('/api/connections/:connectionId/jira/board', async (req, res) => {
  try {
    const { boardId, boardName, boardType } = req.body;
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const config = JSON.parse(connection.config || '{}');
    config.boardId = boardId;
    config.boardName = boardName;
    config.boardType = boardType;

    db.prepare('UPDATE connections SET config = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(config), `Jira - ${boardName}`, req.params.connectionId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== CHAT API (Gemini) ==============

// Set Gemini API key
app.post('/api/chat/config', (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const success = gemini.initializeGemini(apiKey);
    if (success) {
      res.json({ success: true, message: 'API key configured successfully' });
    } else {
      res.status(400).json({ error: 'Failed to initialize Gemini' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat with goal context
app.post('/api/goals/:goalId/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const goalId = req.params.goalId;

    // Get goal data
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Get connections
    const connections = db.prepare('SELECT * FROM connections WHERE goal_id = ?').all(goalId);

    // Get files
    const files = db.prepare('SELECT * FROM files WHERE goal_id = ?').all(goalId);

    // Build context from all data sources
    let context = `Goal: "${goal.name}"\n`;
    if (goal.description) {
      context += `Description: ${goal.description}\n`;
    }
    context += '\n';

    // Add connection info
    if (connections.length > 0) {
      context += '=== Connected Data Sources ===\n';
      for (const conn of connections) {
        const config = JSON.parse(conn.config || '{}');
        context += `\n[${conn.type.toUpperCase()}] ${conn.name}\n`;

        if (conn.type === 'jira' && config.boardName) {
          context += `  - Board: ${config.boardName}\n`;
        }
        if (conn.type === 'mysql' && config.database) {
          context += `  - Database: ${config.database}\n`;
        }
        if (conn.type === 'confluence' && config.spaceName) {
          context += `  - Space: ${config.spaceName}\n`;
        }
        if ((conn.type === 'google_drive' || conn.type === 'google_docs') && config.folderName) {
          context += `  - Folder: ${config.folderName}\n`;
        }
      }
      context += '\n';
    }

    // Add file contents
    if (files.length > 0) {
      context += '=== Imported Documents ===\n';
      for (const file of files) {
        context += `\n--- ${file.name} (${file.file_type}) ---\n`;
        if (file.content) {
          // Limit content to avoid token limits
          const truncatedContent = file.content.substring(0, 10000);
          context += truncatedContent;
          if (file.content.length > 10000) {
            context += '\n[Content truncated...]\n';
          }
        }
        context += '\n';
      }
    }

    // Chat with Gemini
    const response = await gemini.chatWithContext(message, context, history || []);

    res.json({ message: response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Summarize a file
app.post('/api/files/:fileId/summarize', async (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.content) {
      return res.status(400).json({ error: 'File has no content to summarize' });
    }

    const summary = await gemini.summarizeContent(file.content, file.file_type);
    res.json({ summary, file: { id: file.id, name: file.name, goal_id: file.goal_id } });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extract key points from a file
app.post('/api/files/:fileId/extract-points', async (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.content) {
      return res.status(400).json({ error: 'File has no content to analyze' });
    }

    const prompt = `Extract key points, action items, and important information from the following document. Format as a bulleted list:\n\n${file.content}`;
    const result = await gemini.chatWithContext(prompt, '', []);
    res.json({ points: result, file: { id: file.id, name: file.name, goal_id: file.goal_id } });
  } catch (error) {
    console.error('Extract points error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== WIDGETS API ==============

// Get widgets for a goal
app.get('/api/goals/:goalId/widgets', (req, res) => {
  try {
    const widgets = db.prepare('SELECT * FROM widgets WHERE goal_id = ? ORDER BY position ASC, created_at DESC').all(req.params.goalId);
    res.json(widgets.map(w => ({ ...w, config: JSON.parse(w.config || '{}') })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a widget
app.post('/api/goals/:goalId/widgets', (req, res) => {
  try {
    const { file_id, widget_type, title, content, config } = req.body;
    const id = uuidv4();

    db.prepare('INSERT INTO widgets (id, goal_id, file_id, widget_type, title, content, config) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.params.goalId, file_id || null, widget_type, title, content, JSON.stringify(config || {}));

    const widget = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id);
    res.status(201).json({ ...widget, config: JSON.parse(widget.config || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a widget (refresh content)
app.put('/api/widgets/:id', (req, res) => {
  try {
    const { content } = req.body;

    db.prepare('UPDATE widgets SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(content, req.params.id);

    const widget = db.prepare('SELECT * FROM widgets WHERE id = ?').get(req.params.id);
    res.json({ ...widget, config: JSON.parse(widget.config || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a widget
app.delete('/api/widgets/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM widgets WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder widgets
app.post('/api/widgets/reorder', (req, res) => {
  try {
    const { positions } = req.body;

    if (!positions || !Array.isArray(positions)) {
      return res.status(400).json({ error: 'positions array is required' });
    }

    const updateStmt = db.prepare('UPDATE widgets SET position = ? WHERE id = ?');
    const transaction = db.transaction(() => {
      for (const { id, position } of positions) {
        updateStmt.run(position, id);
      }
    });
    transaction();

    res.json({ success: true });
  } catch (error) {
    console.error('Widget reorder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh a widget's content
app.post('/api/widgets/:id/refresh', async (req, res) => {
  try {
    const widget = db.prepare('SELECT * FROM widgets WHERE id = ?').get(req.params.id);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    if (!widget.file_id) {
      return res.status(400).json({ error: 'Widget has no associated file' });
    }

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(widget.file_id);
    if (!file || !file.content) {
      return res.status(400).json({ error: 'File not found or has no content' });
    }

    let newContent;
    if (widget.widget_type === 'summary') {
      newContent = await gemini.summarizeContent(file.content, file.file_type);
    } else if (widget.widget_type === 'key_points') {
      const prompt = `Extract key points, action items, and important information from the following document. Format as a bulleted list:\n\n${file.content}`;
      newContent = await gemini.chatWithContext(prompt, '', []);
    } else {
      return res.status(400).json({ error: 'Cannot refresh this widget type' });
    }

    db.prepare('UPDATE widgets SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newContent, req.params.id);

    const updatedWidget = db.prepare('SELECT * FROM widgets WHERE id = ?').get(req.params.id);
    res.json({ ...updatedWidget, config: JSON.parse(updatedWidget.config || '{}') });
  } catch (error) {
    console.error('Widget refresh error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
