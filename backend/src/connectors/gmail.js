/**
 * Gmail Connector
 *
 * Standalone module for interacting with Gmail API.
 * Can be used independently for testing or integrated into the main app.
 *
 * Usage:
 *   const gmail = require('./connectors/gmail');
 *
 *   // List recent emails
 *   const emails = await gmail.listMessages(tokens);
 *
 *   // Get a specific email with body
 *   const email = await gmail.getMessage(tokens, messageId);
 *
 *   // Search emails
 *   const results = await gmail.searchMessages(tokens, 'from:someone@example.com');
 */

const { google } = require('googleapis');
const googleAuth = require('./googleAuth');

/**
 * List messages from inbox
 * @param {Object} tokens - OAuth tokens { accessToken, refreshToken }
 * @param {Object} options - Optional parameters
 * @param {number} options.maxResults - Maximum messages to return (default: 20)
 * @param {string} options.query - Gmail search query (e.g., 'is:unread', 'from:someone@example.com')
 * @param {string} options.pageToken - Token for pagination
 * @param {string[]} options.labelIds - Filter by label IDs (e.g., ['INBOX', 'UNREAD'])
 * @returns {Promise<Object>} { messages: Array, nextPageToken: string|null }
 */
async function listMessages(tokens, options = {}) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const {
    maxResults = 20,
    query = '',
    pageToken = null,
    labelIds = null,
  } = options;

  const params = {
    userId: 'me',
    maxResults,
  };

  if (query) params.q = query;
  if (pageToken) params.pageToken = pageToken;
  if (labelIds) params.labelIds = labelIds;

  const response = await gmail.users.messages.list(params);
  const messageList = response.data.messages || [];

  // Get metadata for each message
  const messages = await Promise.all(
    messageList.slice(0, maxResults).map(async (msg) => {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date', 'Cc', 'Bcc'],
      });

      const headers = details.data.payload.headers;
      const getHeader = (name) => headers.find((h) => h.name === name)?.value || '';

      return {
        id: msg.id,
        threadId: msg.threadId,
        from: getHeader('From'),
        to: getHeader('To'),
        cc: getHeader('Cc'),
        bcc: getHeader('Bcc'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: details.data.snippet,
        labelIds: details.data.labelIds || [],
        isUnread: details.data.labelIds?.includes('UNREAD') || false,
        isStarred: details.data.labelIds?.includes('STARRED') || false,
      };
    })
  );

  return {
    messages,
    nextPageToken: response.data.nextPageToken || null,
  };
}

/**
 * Get a single message with full body content
 * @param {Object} tokens - OAuth tokens
 * @param {string} messageId - Gmail message ID
 * @returns {Promise<Object>} Full message object with body
 */
async function getMessage(tokens, messageId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const headers = response.data.payload.headers;
  const getHeader = (name) => headers.find((h) => h.name === name)?.value || '';

  // Extract body from parts
  let textBody = '';
  let htmlBody = '';
  const attachments = [];

  function extractParts(parts, partId = '') {
    if (!parts) return;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPartId = partId ? `${partId}.${i}` : `${i}`;

      if (part.mimeType === 'text/plain' && part.body.data) {
        textBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body.data) {
        htmlBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.filename && part.body.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          attachmentId: part.body.attachmentId,
          partId: currentPartId,
        });
      } else if (part.parts) {
        extractParts(part.parts, currentPartId);
      }
    }
  }

  // Handle single-part messages
  if (response.data.payload.body?.data) {
    const mimeType = response.data.payload.mimeType;
    const content = Buffer.from(response.data.payload.body.data, 'base64').toString('utf-8');
    if (mimeType === 'text/html') {
      htmlBody = content;
    } else {
      textBody = content;
    }
  } else {
    extractParts(response.data.payload.parts);
  }

  return {
    id: response.data.id,
    threadId: response.data.threadId,
    from: getHeader('From'),
    to: getHeader('To'),
    cc: getHeader('Cc'),
    bcc: getHeader('Bcc'),
    subject: getHeader('Subject'),
    date: getHeader('Date'),
    textBody,
    htmlBody,
    snippet: response.data.snippet,
    labelIds: response.data.labelIds || [],
    attachments,
    isUnread: response.data.labelIds?.includes('UNREAD') || false,
    isStarred: response.data.labelIds?.includes('STARRED') || false,
  };
}

/**
 * Search messages using Gmail query syntax
 * @param {Object} tokens - OAuth tokens
 * @param {string} query - Gmail search query
 * @param {Object} options - Optional parameters
 * @param {number} options.maxResults - Maximum results (default: 20)
 * @returns {Promise<Object>} { messages: Array, nextPageToken: string|null }
 */
async function searchMessages(tokens, query, options = {}) {
  return listMessages(tokens, { ...options, query });
}

/**
 * Get all labels
 * @param {Object} tokens - OAuth tokens
 * @returns {Promise<Array>} Array of label objects
 */
async function getLabels(tokens) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const response = await gmail.users.labels.list({ userId: 'me' });
  return response.data.labels || [];
}

/**
 * Get messages by label
 * @param {Object} tokens - OAuth tokens
 * @param {string} labelId - Label ID (e.g., 'INBOX', 'SENT', 'DRAFT')
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} { messages: Array, nextPageToken: string|null }
 */
async function getMessagesByLabel(tokens, labelId, options = {}) {
  return listMessages(tokens, { ...options, labelIds: [labelId] });
}

/**
 * Get unread messages
 * @param {Object} tokens - OAuth tokens
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} { messages: Array, nextPageToken: string|null }
 */
async function getUnreadMessages(tokens, options = {}) {
  return listMessages(tokens, { ...options, query: 'is:unread' });
}

/**
 * Get starred messages
 * @param {Object} tokens - OAuth tokens
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} { messages: Array, nextPageToken: string|null }
 */
async function getStarredMessages(tokens, options = {}) {
  return listMessages(tokens, { ...options, query: 'is:starred' });
}

/**
 * Get messages with attachments
 * @param {Object} tokens - OAuth tokens
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} { messages: Array, nextPageToken: string|null }
 */
async function getMessagesWithAttachments(tokens, options = {}) {
  return listMessages(tokens, { ...options, query: 'has:attachment' });
}

/**
 * Get thread (conversation) by ID
 * @param {Object} tokens - OAuth tokens
 * @param {string} threadId - Thread ID
 * @returns {Promise<Object>} Thread with all messages
 */
async function getThread(tokens, threadId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const response = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  const messages = response.data.messages.map((msg) => {
    const headers = msg.payload.headers;
    const getHeader = (name) => headers.find((h) => h.name === name)?.value || '';

    return {
      id: msg.id,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      snippet: msg.snippet,
      labelIds: msg.labelIds || [],
    };
  });

  return {
    id: response.data.id,
    historyId: response.data.historyId,
    messages,
  };
}

/**
 * Get attachment data
 * @param {Object} tokens - OAuth tokens
 * @param {string} messageId - Message ID
 * @param {string} attachmentId - Attachment ID
 * @returns {Promise<Buffer>} Attachment data as buffer
 */
async function getAttachment(tokens, messageId, attachmentId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const response = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  });

  return Buffer.from(response.data.data, 'base64');
}

/**
 * Get user's email profile
 * @param {Object} tokens - OAuth tokens
 * @returns {Promise<Object>} User profile with email address
 */
async function getProfile(tokens) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const response = await gmail.users.getProfile({ userId: 'me' });
  return {
    emailAddress: response.data.emailAddress,
    messagesTotal: response.data.messagesTotal,
    threadsTotal: response.data.threadsTotal,
    historyId: response.data.historyId,
  };
}

/**
 * Get email count statistics
 * @param {Object} tokens - OAuth tokens
 * @returns {Promise<Object>} { total, unread, starred, drafts }
 */
async function getEmailStats(tokens) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const profile = await gmail.users.getProfile({ userId: 'me' });

  // Get unread count
  const unreadResponse = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 1,
  });

  // Get starred count
  const starredResponse = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:starred',
    maxResults: 1,
  });

  // Get draft count
  const draftsResponse = await gmail.users.drafts.list({
    userId: 'me',
    maxResults: 1,
  });

  return {
    total: profile.data.messagesTotal,
    threads: profile.data.threadsTotal,
    unread: unreadResponse.data.resultSizeEstimate || 0,
    starred: starredResponse.data.resultSizeEstimate || 0,
    drafts: draftsResponse.data.resultSizeEstimate || 0,
  };
}

// Common Gmail query helpers
const QUERIES = {
  UNREAD: 'is:unread',
  STARRED: 'is:starred',
  IMPORTANT: 'is:important',
  SENT: 'in:sent',
  DRAFTS: 'in:drafts',
  TRASH: 'in:trash',
  SPAM: 'in:spam',
  HAS_ATTACHMENT: 'has:attachment',
  TODAY: 'newer_than:1d',
  THIS_WEEK: 'newer_than:7d',
  THIS_MONTH: 'newer_than:30d',
};

// Label IDs
const LABELS = {
  INBOX: 'INBOX',
  SENT: 'SENT',
  DRAFTS: 'DRAFT',
  TRASH: 'TRASH',
  SPAM: 'SPAM',
  STARRED: 'STARRED',
  UNREAD: 'UNREAD',
  IMPORTANT: 'IMPORTANT',
};

module.exports = {
  // Core functions
  listMessages,
  getMessage,
  searchMessages,
  getLabels,

  // Convenience functions
  getMessagesByLabel,
  getUnreadMessages,
  getStarredMessages,
  getMessagesWithAttachments,
  getThread,
  getAttachment,
  getProfile,
  getEmailStats,

  // Constants
  QUERIES,
  LABELS,
};
