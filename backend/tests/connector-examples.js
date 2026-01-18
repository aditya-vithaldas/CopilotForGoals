/**
 * Connector Test Examples
 *
 * This file demonstrates how to use each connector module independently.
 * Each connector is self-contained and can be tested without running the full server.
 *
 * Run specific tests:
 *   node tests/connector-examples.js gmail
 *   node tests/connector-examples.js drive
 *   node tests/connector-examples.js docs
 *   node tests/connector-examples.js jira
 *
 * Or run all tests:
 *   node tests/connector-examples.js all
 */

const path = require('path');

// Import connectors directly - each can be tested independently
const googleAuth = require('../src/connectors/googleAuth');
const googleDrive = require('../src/connectors/googleDrive');
const googleDocs = require('../src/connectors/googleDocs');
const gmail = require('../src/connectors/gmail');
const jira = require('../src/connectors/jira');

// ============================================================
// TEST TOKENS/CREDENTIALS
// Replace these with real values to test with actual services
// ============================================================

// For Google services (get from OAuth flow or database)
const GOOGLE_TOKENS = {
  accessToken: process.env.GOOGLE_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN',
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN || 'YOUR_REFRESH_TOKEN',
};

// For Jira
const JIRA_CONFIG = {
  jiraUrl: process.env.JIRA_URL || 'https://yourcompany.atlassian.net',
  email: process.env.JIRA_EMAIL || 'your.email@example.com',
  apiToken: process.env.JIRA_API_TOKEN || 'YOUR_API_TOKEN',
  boardId: process.env.JIRA_BOARD_ID || 1,
};

// ============================================================
// GMAIL CONNECTOR TESTS
// ============================================================

async function testGmail() {
  console.log('\n=== GMAIL CONNECTOR TESTS ===\n');

  try {
    // Test 1: List recent messages
    console.log('1. Testing listMessages...');
    const { messages } = await gmail.listMessages(GOOGLE_TOKENS, { maxResults: 5 });
    console.log(`   ✓ Found ${messages.length} messages`);
    if (messages.length > 0) {
      console.log(`   First email: "${messages[0].subject}" from ${messages[0].from}`);
    }

    // Test 2: Get unread messages
    console.log('\n2. Testing getUnreadMessages...');
    const unread = await gmail.getUnreadMessages(GOOGLE_TOKENS, { maxResults: 5 });
    console.log(`   ✓ Found ${unread.messages.length} unread messages`);

    // Test 3: Get starred messages
    console.log('\n3. Testing getStarredMessages...');
    const starred = await gmail.getStarredMessages(GOOGLE_TOKENS, { maxResults: 5 });
    console.log(`   ✓ Found ${starred.messages.length} starred messages`);

    // Test 4: Get labels
    console.log('\n4. Testing getLabels...');
    const labels = await gmail.getLabels(GOOGLE_TOKENS);
    console.log(`   ✓ Found ${labels.length} labels`);

    // Test 5: Search messages
    console.log('\n5. Testing searchMessages...');
    const searchResults = await gmail.searchMessages(GOOGLE_TOKENS, 'is:important', {
      maxResults: 3,
    });
    console.log(`   ✓ Found ${searchResults.messages.length} important messages`);

    // Test 6: Get email stats
    console.log('\n6. Testing getEmailStats...');
    const stats = await gmail.getEmailStats(GOOGLE_TOKENS);
    console.log(`   ✓ Stats: ${stats.total} total, ${stats.unread} unread, ${stats.starred} starred`);

    // Test 7: Get single message with body (if we have messages)
    if (messages.length > 0) {
      console.log('\n7. Testing getMessage (with body)...');
      const fullMessage = await gmail.getMessage(GOOGLE_TOKENS, messages[0].id);
      console.log(`   ✓ Got full message: "${fullMessage.subject}"`);
      console.log(`   Body length: ${fullMessage.textBody?.length || 0} chars`);
    }

    console.log('\n✅ Gmail connector tests passed!\n');
  } catch (error) {
    console.error('\n❌ Gmail test failed:', error.message);
    if (error.message.includes('insufficient authentication scopes')) {
      console.log('   Hint: Your tokens may not have gmail.readonly scope.');
    }
  }
}

// ============================================================
// GOOGLE DRIVE CONNECTOR TESTS
// ============================================================

async function testGoogleDrive() {
  console.log('\n=== GOOGLE DRIVE CONNECTOR TESTS ===\n');

  try {
    // Test 1: List files
    console.log('1. Testing listFiles...');
    const { files } = await googleDrive.listFiles(GOOGLE_TOKENS, null, { pageSize: 10 });
    console.log(`   ✓ Found ${files.length} files`);
    if (files.length > 0) {
      console.log(`   First file: "${files[0].name}" (${files[0].mimeType})`);
    }

    // Test 2: List folders
    console.log('\n2. Testing listFolders...');
    const folders = await googleDrive.listFolders(GOOGLE_TOKENS, 'root');
    console.log(`   ✓ Found ${folders.length} folders in root`);

    // Test 3: Search files
    console.log('\n3. Testing searchFiles...');
    const searchResults = await googleDrive.searchFiles(GOOGLE_TOKENS, 'document');
    console.log(`   ✓ Found ${searchResults.length} files matching "document"`);

    // Test 4: Get files by type (Google Docs)
    console.log('\n4. Testing getFilesByType (Google Docs)...');
    const docs = await googleDrive.getFilesByType(
      GOOGLE_TOKENS,
      googleDrive.MIME_TYPES.DOCUMENT,
      null,
      { pageSize: 5 }
    );
    console.log(`   ✓ Found ${docs.length} Google Docs`);

    // Test 5: Get recent files
    console.log('\n5. Testing getRecentFiles...');
    const recent = await googleDrive.getRecentFiles(GOOGLE_TOKENS, 5);
    console.log(`   ✓ Got ${recent.length} recently viewed files`);

    // Test 6: Get file metadata (if we have files)
    if (files.length > 0) {
      console.log('\n6. Testing getFileMetadata...');
      const metadata = await googleDrive.getFileMetadata(GOOGLE_TOKENS, files[0].id);
      console.log(`   ✓ Got metadata for: "${metadata.name}"`);
      console.log(`   Modified: ${metadata.modifiedTime}`);
    }

    console.log('\n✅ Google Drive connector tests passed!\n');
  } catch (error) {
    console.error('\n❌ Google Drive test failed:', error.message);
  }
}

// ============================================================
// GOOGLE DOCS CONNECTOR TESTS
// ============================================================

async function testGoogleDocs() {
  console.log('\n=== GOOGLE DOCS CONNECTOR TESTS ===\n');

  try {
    // First, find a Google Doc to test with
    console.log('Finding a Google Doc to test with...');
    const docs = await googleDrive.getFilesByType(
      GOOGLE_TOKENS,
      googleDrive.MIME_TYPES.DOCUMENT,
      null,
      { pageSize: 1 }
    );

    if (docs.length === 0) {
      console.log('   No Google Docs found to test with.');
      console.log('   Create a Google Doc and try again.');
      return;
    }

    const docId = docs[0].id;
    console.log(`   Using document: "${docs[0].name}" (${docId})\n`);

    // Test 1: Get document content
    console.log('1. Testing getDocumentContent...');
    const content = await googleDocs.getDocumentContent(GOOGLE_TOKENS, docId);
    console.log(`   ✓ Got document: "${content.title}"`);
    console.log(`   Content length: ${content.content.length} chars`);

    // Test 2: Get document metadata
    console.log('\n2. Testing getDocumentMetadata...');
    const metadata = await googleDocs.getDocumentMetadata(GOOGLE_TOKENS, docId);
    console.log(`   ✓ Title: ${metadata.title}`);
    console.log(`   Revision ID: ${metadata.revisionId}`);

    // Test 3: Get document headings
    console.log('\n3. Testing getDocumentHeadings...');
    const headings = await googleDocs.getDocumentHeadings(GOOGLE_TOKENS, docId);
    console.log(`   ✓ Found ${headings.length} headings`);
    headings.slice(0, 3).forEach((h) => console.log(`     H${h.level}: ${h.text}`));

    // Test 4: Get document stats
    console.log('\n4. Testing getDocumentStats...');
    const stats = await googleDocs.getDocumentStats(GOOGLE_TOKENS, docId);
    console.log(`   ✓ Words: ${stats.words}, Characters: ${stats.characters}, Paragraphs: ${stats.paragraphs}`);

    // Test 5: Get document tables
    console.log('\n5. Testing getDocumentTables...');
    const tables = await googleDocs.getDocumentTables(GOOGLE_TOKENS, docId);
    console.log(`   ✓ Found ${tables.length} tables`);

    // Test 6: Get document links
    console.log('\n6. Testing getDocumentLinks...');
    const links = await googleDocs.getDocumentLinks(GOOGLE_TOKENS, docId);
    console.log(`   ✓ Found ${links.length} links`);

    console.log('\n✅ Google Docs connector tests passed!\n');
  } catch (error) {
    console.error('\n❌ Google Docs test failed:', error.message);
  }
}

// ============================================================
// JIRA CONNECTOR TESTS
// ============================================================

async function testJira() {
  console.log('\n=== JIRA CONNECTOR TESTS ===\n');
  const { jiraUrl, email, apiToken, boardId } = JIRA_CONFIG;

  try {
    // Test 1: Test connection
    console.log('1. Testing connection...');
    const result = await jira.testConnection(jiraUrl, email, apiToken);
    if (result.success) {
      console.log(`   ✓ Connected as: ${result.user.displayName} (${result.user.email})`);
    } else {
      console.log(`   ✗ Connection failed: ${result.error}`);
      return;
    }

    // Test 2: Get boards
    console.log('\n2. Testing getBoards...');
    const boards = await jira.getBoards(jiraUrl, email, apiToken);
    console.log(`   ✓ Found ${boards.length} boards`);
    boards.slice(0, 3).forEach((b) => console.log(`     - ${b.name} (${b.type})`));

    // Test 3: Get board details
    console.log(`\n3. Testing getBoard (ID: ${boardId})...`);
    const board = await jira.getBoard(jiraUrl, email, apiToken, boardId);
    console.log(`   ✓ Board: ${board.name} (${board.type})`);

    // Test 4: Get board configuration
    console.log('\n4. Testing getBoardConfiguration...');
    const config = await jira.getBoardConfiguration(jiraUrl, email, apiToken, boardId);
    console.log(`   ✓ Columns: ${config.columns.map((c) => c.name).join(' → ')}`);

    // Test 5: Get board issues
    console.log('\n5. Testing getBoardIssues...');
    const issues = await jira.getBoardIssues(jiraUrl, email, apiToken, boardId, {
      maxResults: 5,
    });
    console.log(`   ✓ Found ${issues.length} issues`);
    issues.slice(0, 3).forEach((i) => console.log(`     - ${i.key}: ${i.summary} [${i.status}]`));

    // Test 6: Get active sprint
    console.log('\n6. Testing getActiveSprint...');
    const sprint = await jira.getActiveSprint(jiraUrl, email, apiToken, boardId);
    if (sprint) {
      console.log(`   ✓ Active sprint: ${sprint.name}`);
      console.log(`   Goal: ${sprint.goal || 'No goal set'}`);
    } else {
      console.log('   No active sprint (Kanban board or no sprint started)');
    }

    // Test 7: Get epics
    console.log('\n7. Testing getEpics...');
    const epics = await jira.getEpics(jiraUrl, email, apiToken, boardId);
    console.log(`   ✓ Found ${epics.length} epics`);
    epics.slice(0, 3).forEach((e) => console.log(`     - ${e.key}: ${e.name}`));

    // Test 8: Get recent tickets
    console.log('\n8. Testing getRecentTickets...');
    const recent = await jira.getRecentTickets(jiraUrl, email, apiToken, boardId, 3);
    console.log(`   ✓ ${recent.length} recent tickets`);

    // Test 9: Get projects
    console.log('\n9. Testing getProjects...');
    const projects = await jira.getProjects(jiraUrl, email, apiToken);
    console.log(`   ✓ Found ${projects.length} accessible projects`);
    projects.slice(0, 3).forEach((p) => console.log(`     - ${p.key}: ${p.name}`));

    console.log('\n✅ Jira connector tests passed!\n');
  } catch (error) {
    console.error('\n❌ Jira test failed:', error.message);
    if (error.response?.status === 401) {
      console.log('   Hint: Check your Jira credentials (email and API token).');
    }
  }
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runTests() {
  const arg = process.argv[2]?.toLowerCase() || 'help';

  switch (arg) {
    case 'gmail':
      await testGmail();
      break;
    case 'drive':
      await testGoogleDrive();
      break;
    case 'docs':
      await testGoogleDocs();
      break;
    case 'jira':
      await testJira();
      break;
    case 'all':
      await testGmail();
      await testGoogleDrive();
      await testGoogleDocs();
      await testJira();
      break;
    default:
      console.log(`
Connector Test Examples
=======================

Usage: node tests/connector-examples.js <connector>

Available connectors:
  gmail   - Test Gmail connector (list, search, get messages)
  drive   - Test Google Drive connector (list, search files)
  docs    - Test Google Docs connector (get content, headings, etc.)
  jira    - Test Jira connector (boards, issues, sprints)
  all     - Run all tests

Environment variables (optional):
  GOOGLE_ACCESS_TOKEN   - Google OAuth access token
  GOOGLE_REFRESH_TOKEN  - Google OAuth refresh token
  JIRA_URL              - Jira instance URL
  JIRA_EMAIL            - Jira user email
  JIRA_API_TOKEN        - Jira API token
  JIRA_BOARD_ID         - Jira board ID to test with

Example:
  JIRA_URL=https://mycompany.atlassian.net \\
  JIRA_EMAIL=me@example.com \\
  JIRA_API_TOKEN=mytoken \\
  node tests/connector-examples.js jira
`);
  }
}

runTests().catch(console.error);
