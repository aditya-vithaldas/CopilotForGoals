/**
 * Comprehensive Connector Tests
 *
 * This script tests all connectors using credentials from the database.
 * Run: node tests/run-connector-tests.js
 */

const path = require('path');
const Database = require('better-sqlite3');

// Import connectors
const googleAuth = require('../src/connectors/googleAuth');
const googleDrive = require('../src/connectors/googleDrive');
const googleDocs = require('../src/connectors/googleDocs');
const gmail = require('../src/connectors/gmail');
const jira = require('../src/connectors/jira');

// Connect to database
const dbPath = path.join(__dirname, '..', 'cowork.db');
const db = new Database(dbPath);

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.skipped++;
}

// ============================================================
// GOOGLE AUTH TESTS
// ============================================================

async function testGoogleAuth() {
  console.log('\n' + '='.repeat(60));
  console.log('GOOGLE AUTH CONNECTOR TESTS');
  console.log('='.repeat(60) + '\n');

  try {
    // Test 1: Check config is exposed
    logTest('googleAuth.config exists', googleAuth.config ? 'PASS' : 'FAIL');
    logTest('googleAuth.config.SCOPES',
      googleAuth.config.SCOPES && googleAuth.config.SCOPES.length >= 4 ? 'PASS' : 'FAIL',
      `${googleAuth.config.SCOPES?.length || 0} scopes defined`);

    // Test 2: Generate auth URL
    const authUrl = googleAuth.getAuthUrl({ goalId: 'test', connectionType: 'google_drive' });
    logTest('getAuthUrl()',
      authUrl && authUrl.includes('accounts.google.com') ? 'PASS' : 'FAIL',
      'URL generated');

    // Test 3: Get authenticated client
    const conn = db.prepare("SELECT config FROM connections WHERE type = 'google_drive' LIMIT 1").get();
    if (conn) {
      const config = JSON.parse(conn.config);
      const client = googleAuth.getAuthenticatedClient(config);
      logTest('getAuthenticatedClient()', client ? 'PASS' : 'FAIL');
    } else {
      logTest('getAuthenticatedClient()', 'SKIP', 'No Google connection');
    }

  } catch (error) {
    logTest('GoogleAuth Error', 'FAIL', error.message);
  }
}

// ============================================================
// GOOGLE DRIVE TESTS
// ============================================================

async function testGoogleDrive() {
  console.log('\n' + '='.repeat(60));
  console.log('GOOGLE DRIVE CONNECTOR TESTS');
  console.log('='.repeat(60) + '\n');

  const conn = db.prepare("SELECT config FROM connections WHERE type = 'google_drive' LIMIT 1").get();
  if (!conn) {
    logTest('Google Drive Tests', 'SKIP', 'No Google Drive connection in database');
    return;
  }

  const config = JSON.parse(conn.config);
  const tokens = {
    accessToken: config.accessToken,
    refreshToken: config.refreshToken
  };

  try {
    // Test 1: List files
    console.log('Testing listFiles...');
    const filesResult = await googleDrive.listFiles(tokens, null, { pageSize: 5 });
    logTest('listFiles()',
      filesResult && Array.isArray(filesResult.files) ? 'PASS' : 'FAIL',
      `${filesResult.files?.length || 0} files returned`);

    // Test 2: List folders
    console.log('Testing listFolders...');
    const folders = await googleDrive.listFolders(tokens, 'root');
    logTest('listFolders()',
      Array.isArray(folders) ? 'PASS' : 'FAIL',
      `${folders.length} folders in root`);

    // Test 3: Search files
    console.log('Testing searchFiles...');
    const searchResults = await googleDrive.searchFiles(tokens, 'doc');
    logTest('searchFiles()',
      Array.isArray(searchResults) ? 'PASS' : 'FAIL',
      `${searchResults.length} files matching "doc"`);

    // Test 4: Get files by type (Google Docs)
    console.log('Testing getFilesByType...');
    const docs = await googleDrive.getFilesByType(tokens, googleDrive.MIME_TYPES.DOCUMENT, null, { pageSize: 3 });
    logTest('getFilesByType(DOCUMENT)',
      Array.isArray(docs) ? 'PASS' : 'FAIL',
      `${docs.length} Google Docs found`);

    // Test 5: Get recent files
    console.log('Testing getRecentFiles...');
    const recent = await googleDrive.getRecentFiles(tokens, 5);
    logTest('getRecentFiles()',
      Array.isArray(recent) ? 'PASS' : 'FAIL',
      `${recent.length} recent files`);

    // Test 6: Get file metadata (if we have files)
    if (filesResult.files && filesResult.files.length > 0) {
      console.log('Testing getFileMetadata...');
      const metadata = await googleDrive.getFileMetadata(tokens, filesResult.files[0].id);
      logTest('getFileMetadata()',
        metadata && metadata.name ? 'PASS' : 'FAIL',
        `"${metadata?.name}"`);
    }

    // Test 7: MIME_TYPES constants
    logTest('MIME_TYPES.DOCUMENT',
      googleDrive.MIME_TYPES.DOCUMENT === 'application/vnd.google-apps.document' ? 'PASS' : 'FAIL');
    logTest('MIME_TYPES.FOLDER',
      googleDrive.MIME_TYPES.FOLDER === 'application/vnd.google-apps.folder' ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('Google Drive Error', 'FAIL', error.message);
  }
}

// ============================================================
// GOOGLE DOCS TESTS
// ============================================================

async function testGoogleDocs() {
  console.log('\n' + '='.repeat(60));
  console.log('GOOGLE DOCS CONNECTOR TESTS');
  console.log('='.repeat(60) + '\n');

  const conn = db.prepare("SELECT config FROM connections WHERE type IN ('google_docs', 'google_drive') LIMIT 1").get();
  if (!conn) {
    logTest('Google Docs Tests', 'SKIP', 'No Google connection in database');
    return;
  }

  const config = JSON.parse(conn.config);
  const tokens = {
    accessToken: config.accessToken,
    refreshToken: config.refreshToken
  };

  try {
    // First find a Google Doc to test with
    console.log('Finding a Google Doc to test with...');
    const docs = await googleDrive.getFilesByType(tokens, googleDrive.MIME_TYPES.DOCUMENT, null, { pageSize: 1 });

    if (docs.length === 0) {
      logTest('Google Docs Tests', 'SKIP', 'No Google Docs found in Drive');
      return;
    }

    const docId = docs[0].id;
    console.log(`Using document: "${docs[0].name}" (${docId})\n`);

    // Test 1: Get document content
    console.log('Testing getDocumentContent...');
    const content = await googleDocs.getDocumentContent(tokens, docId);
    logTest('getDocumentContent()',
      content && content.title && content.content !== undefined ? 'PASS' : 'FAIL',
      `"${content?.title}" (${content?.content?.length || 0} chars)`);

    // Test 2: Get document metadata
    console.log('Testing getDocumentMetadata...');
    const metadata = await googleDocs.getDocumentMetadata(tokens, docId);
    logTest('getDocumentMetadata()',
      metadata && metadata.title ? 'PASS' : 'FAIL',
      `revisionId: ${metadata?.revisionId?.substring(0, 20)}...`);

    // Test 3: Get document headings
    console.log('Testing getDocumentHeadings...');
    const headings = await googleDocs.getDocumentHeadings(tokens, docId);
    logTest('getDocumentHeadings()',
      Array.isArray(headings) ? 'PASS' : 'FAIL',
      `${headings.length} headings found`);

    // Test 4: Get document stats
    console.log('Testing getDocumentStats...');
    const stats = await googleDocs.getDocumentStats(tokens, docId);
    logTest('getDocumentStats()',
      stats && typeof stats.words === 'number' ? 'PASS' : 'FAIL',
      `${stats?.words} words, ${stats?.paragraphs} paragraphs`);

    // Test 5: Get document tables
    console.log('Testing getDocumentTables...');
    const tables = await googleDocs.getDocumentTables(tokens, docId);
    logTest('getDocumentTables()',
      Array.isArray(tables) ? 'PASS' : 'FAIL',
      `${tables.length} tables found`);

    // Test 6: Get document links
    console.log('Testing getDocumentLinks...');
    const links = await googleDocs.getDocumentLinks(tokens, docId);
    logTest('getDocumentLinks()',
      Array.isArray(links) ? 'PASS' : 'FAIL',
      `${links.length} links found`);

  } catch (error) {
    logTest('Google Docs Error', 'FAIL', error.message);
  }
}

// ============================================================
// GMAIL TESTS
// ============================================================

async function testGmail() {
  console.log('\n' + '='.repeat(60));
  console.log('GMAIL CONNECTOR TESTS');
  console.log('='.repeat(60) + '\n');

  const conn = db.prepare("SELECT config FROM connections WHERE type = 'gmail' LIMIT 1").get();
  if (!conn) {
    logTest('Gmail Tests', 'SKIP', 'No Gmail connection in database');
    return;
  }

  const config = JSON.parse(conn.config);
  const tokens = {
    accessToken: config.accessToken,
    refreshToken: config.refreshToken
  };

  try {
    // Test 1: List messages
    console.log('Testing listMessages...');
    const messagesResult = await gmail.listMessages(tokens, { maxResults: 5 });
    logTest('listMessages()',
      messagesResult && Array.isArray(messagesResult.messages) ? 'PASS' : 'FAIL',
      `${messagesResult.messages?.length || 0} messages returned`);

    // Test 2: Get unread messages
    console.log('Testing getUnreadMessages...');
    const unread = await gmail.getUnreadMessages(tokens, { maxResults: 5 });
    logTest('getUnreadMessages()',
      unread && Array.isArray(unread.messages) ? 'PASS' : 'FAIL',
      `${unread.messages?.length || 0} unread messages`);

    // Test 3: Get starred messages
    console.log('Testing getStarredMessages...');
    const starred = await gmail.getStarredMessages(tokens, { maxResults: 5 });
    logTest('getStarredMessages()',
      starred && Array.isArray(starred.messages) ? 'PASS' : 'FAIL',
      `${starred.messages?.length || 0} starred messages`);

    // Test 4: Get labels
    console.log('Testing getLabels...');
    const labels = await gmail.getLabels(tokens);
    logTest('getLabels()',
      Array.isArray(labels) ? 'PASS' : 'FAIL',
      `${labels.length} labels found`);

    // Test 5: Search messages
    console.log('Testing searchMessages...');
    const searchResults = await gmail.searchMessages(tokens, 'is:important', { maxResults: 3 });
    logTest('searchMessages()',
      searchResults && Array.isArray(searchResults.messages) ? 'PASS' : 'FAIL',
      `${searchResults.messages?.length || 0} important messages`);

    // Test 6: Get messages with attachments
    console.log('Testing getMessagesWithAttachments...');
    const withAttach = await gmail.getMessagesWithAttachments(tokens, { maxResults: 3 });
    logTest('getMessagesWithAttachments()',
      withAttach && Array.isArray(withAttach.messages) ? 'PASS' : 'FAIL',
      `${withAttach.messages?.length || 0} messages with attachments`);

    // Test 7: Get full message (if we have messages)
    if (messagesResult.messages && messagesResult.messages.length > 0) {
      console.log('Testing getMessage (full body)...');
      const fullMessage = await gmail.getMessage(tokens, messagesResult.messages[0].id);
      logTest('getMessage()',
        fullMessage && fullMessage.subject !== undefined ? 'PASS' : 'FAIL',
        `"${fullMessage?.subject?.substring(0, 40)}..."`);
    }

    // Test 8: Get profile
    console.log('Testing getProfile...');
    const profile = await gmail.getProfile(tokens);
    logTest('getProfile()',
      profile && profile.emailAddress ? 'PASS' : 'FAIL',
      profile?.emailAddress);

    // Test 9: QUERIES constants
    logTest('QUERIES.UNREAD', gmail.QUERIES.UNREAD === 'is:unread' ? 'PASS' : 'FAIL');
    logTest('LABELS.INBOX', gmail.LABELS.INBOX === 'INBOX' ? 'PASS' : 'FAIL');

  } catch (error) {
    if (error.message.includes('insufficient authentication scopes')) {
      logTest('Gmail Tests', 'FAIL', 'Insufficient scopes - token needs gmail.readonly permission');
    } else {
      logTest('Gmail Error', 'FAIL', error.message);
    }
  }
}

// ============================================================
// JIRA TESTS
// ============================================================

async function testJira() {
  console.log('\n' + '='.repeat(60));
  console.log('JIRA CONNECTOR TESTS');
  console.log('='.repeat(60) + '\n');

  const conn = db.prepare("SELECT config FROM connections WHERE type = 'jira' LIMIT 1").get();
  if (!conn) {
    logTest('Jira Tests', 'SKIP', 'No Jira connection in database');
    return;
  }

  const config = JSON.parse(conn.config);
  const { jiraUrl, email, apiToken, boardId } = config;

  try {
    // Test 1: Test connection
    console.log('Testing testConnection...');
    const connResult = await jira.testConnection(jiraUrl, email, apiToken);
    logTest('testConnection()',
      connResult.success ? 'PASS' : 'FAIL',
      connResult.success ? `Connected as ${connResult.user.displayName}` : connResult.error);

    if (!connResult.success) {
      console.log('   Skipping remaining Jira tests due to connection failure');
      return;
    }

    // Test 2: Get boards
    console.log('Testing getBoards...');
    const boards = await jira.getBoards(jiraUrl, email, apiToken);
    logTest('getBoards()',
      Array.isArray(boards) ? 'PASS' : 'FAIL',
      `${boards.length} boards found`);

    // Test 3: Get board details
    console.log(`Testing getBoard (ID: ${boardId})...`);
    const board = await jira.getBoard(jiraUrl, email, apiToken, boardId);
    logTest('getBoard()',
      board && board.name ? 'PASS' : 'FAIL',
      `"${board?.name}" (${board?.type})`);

    // Test 4: Get board configuration
    console.log('Testing getBoardConfiguration...');
    const boardConfig = await jira.getBoardConfiguration(jiraUrl, email, apiToken, boardId);
    logTest('getBoardConfiguration()',
      boardConfig && Array.isArray(boardConfig.columns) ? 'PASS' : 'FAIL',
      `${boardConfig?.columns?.length || 0} columns: ${boardConfig?.columns?.map(c => c.name).join(' → ')}`);

    // Test 5: Get board issues
    console.log('Testing getBoardIssues...');
    const issues = await jira.getBoardIssues(jiraUrl, email, apiToken, boardId, { maxResults: 10 });
    logTest('getBoardIssues()',
      Array.isArray(issues) ? 'PASS' : 'FAIL',
      `${issues.length} issues found`);

    // Test 6: Get active sprint
    console.log('Testing getActiveSprint...');
    const sprint = await jira.getActiveSprint(jiraUrl, email, apiToken, boardId);
    logTest('getActiveSprint()',
      sprint === null || (sprint && sprint.name) ? 'PASS' : 'FAIL',
      sprint ? `"${sprint.name}"` : 'No active sprint (Kanban)');

    // Test 7: Get sprints
    console.log('Testing getSprints...');
    const sprints = await jira.getSprints(jiraUrl, email, apiToken, boardId);
    logTest('getSprints()',
      Array.isArray(sprints) ? 'PASS' : 'FAIL',
      `${sprints.length} sprints found`);

    // Test 8: Get epics
    console.log('Testing getEpics...');
    const epics = await jira.getEpics(jiraUrl, email, apiToken, boardId);
    logTest('getEpics()',
      Array.isArray(epics) ? 'PASS' : 'FAIL',
      `${epics.length} epics found`);

    // Test 9: Get recent tickets
    console.log('Testing getRecentTickets...');
    const recent = await jira.getRecentTickets(jiraUrl, email, apiToken, boardId, 5);
    logTest('getRecentTickets()',
      Array.isArray(recent) ? 'PASS' : 'FAIL',
      `${recent.length} recent tickets`);

    // Test 10: Get projects
    console.log('Testing getProjects...');
    const projects = await jira.getProjects(jiraUrl, email, apiToken);
    logTest('getProjects()',
      Array.isArray(projects) ? 'PASS' : 'FAIL',
      `${projects.length} projects accessible`);

    // Test 11: Search issues with JQL
    console.log('Testing searchIssues (JQL)...');
    const searchResult = await jira.searchIssues(jiraUrl, email, apiToken, 'ORDER BY created DESC', { maxResults: 5 });
    logTest('searchIssues()',
      searchResult && Array.isArray(searchResult.issues) ? 'PASS' : 'FAIL',
      `${searchResult?.issues?.length || 0} issues, ${searchResult?.total || 0} total`);

    // Test 12: JQL constants
    logTest('JQL.myOpenIssues',
      jira.JQL.myOpenIssues.includes('currentUser()') ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('Jira Error', 'FAIL', error.message);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          CONNECTOR TEST SUITE - DETAILED REPORT            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\nRunning comprehensive tests on all connectors...');
  console.log('Using credentials from database: cowork.db\n');

  const startTime = Date.now();

  await testGoogleAuth();
  await testGoogleDrive();
  await testGoogleDocs();
  await testGmail();
  await testJira();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`\nTotal: ${results.tests.length} tests in ${duration}s`);

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
  }

  console.log('\n');

  db.close();
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
