/**
 * Connectors Index
 *
 * Central export for all connector modules.
 * Each connector is standalone and can be used independently or imported through this index.
 *
 * Usage:
 *   // Import all connectors
 *   const connectors = require('./connectors');
 *   const emails = await connectors.gmail.listMessages(tokens);
 *
 *   // Or import specific connector
 *   const { gmail } = require('./connectors');
 *   const emails = await gmail.listMessages(tokens);
 *
 *   // Or import connector directly
 *   const gmail = require('./connectors/gmail');
 */

const googleAuth = require('./googleAuth');
const googleDrive = require('./googleDrive');
const googleDocs = require('./googleDocs');
const gmail = require('./gmail');
const jira = require('./jira');

module.exports = {
  // Google services
  googleAuth,
  googleDrive,
  googleDocs,
  gmail,

  // Atlassian
  jira,

  // Backward compatibility alias
  google: {
    ...googleAuth,
    ...googleDrive,
    ...googleDocs,
    // Gmail functions with original names
    listEmails: gmail.listMessages,
    getEmail: gmail.getMessage,
    searchEmails: gmail.searchMessages,
    getLabels: gmail.getLabels,
  },
};
