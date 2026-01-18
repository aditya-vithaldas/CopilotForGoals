/**
 * Google Drive Connector
 *
 * Standalone module for interacting with Google Drive API.
 * Can be used independently for testing or integrated into the main app.
 *
 * Usage:
 *   const googleDrive = require('./connectors/googleDrive');
 *
 *   // List files in a folder
 *   const files = await googleDrive.listFiles(tokens, folderId);
 *
 *   // Search files
 *   const results = await googleDrive.searchFiles(tokens, 'quarterly report');
 *
 *   // Get file metadata
 *   const file = await googleDrive.getFileMetadata(tokens, fileId);
 */

const { google } = require('googleapis');
const googleAuth = require('./googleAuth');

/**
 * List files in Google Drive
 * @param {Object} tokens - OAuth tokens { accessToken, refreshToken }
 * @param {string|null} folderId - Folder ID to list files from (null for root/all)
 * @param {Object} options - Optional parameters
 * @param {number} options.pageSize - Number of files to return (default: 50)
 * @param {string} options.pageToken - Token for pagination
 * @param {string} options.orderBy - Sort order (default: 'modifiedTime desc')
 * @returns {Promise<Object>} { files: Array, nextPageToken: string|null }
 */
async function listFiles(tokens, folderId = null, options = {}) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });

  const { pageSize = 50, pageToken = null, orderBy = 'modifiedTime desc' } = options;

  let query = 'trashed = false';
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  const response = await drive.files.list({
    pageSize,
    pageToken,
    q: query,
    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink, parents)',
    orderBy,
  });

  return {
    files: response.data.files || [],
    nextPageToken: response.data.nextPageToken || null,
  };
}

/**
 * List folders for folder picker/navigation
 * @param {Object} tokens - OAuth tokens
 * @param {string} parentId - Parent folder ID (default: 'root')
 * @returns {Promise<Array>} Array of folder objects
 */
async function listFolders(tokens, parentId = 'root') {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.list({
    pageSize: 100,
    q: `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
    orderBy: 'name',
  });

  return response.data.files || [];
}

/**
 * Get metadata for a specific file
 * @param {Object} tokens - OAuth tokens
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<Object>} File metadata
 */
async function getFileMetadata(tokens, fileId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, modifiedTime, size, webViewLink, description, parents, createdTime',
  });

  return response.data;
}

/**
 * Search files by name or content
 * @param {Object} tokens - OAuth tokens
 * @param {string} query - Search query
 * @param {string|null} folderId - Limit search to folder (optional)
 * @param {Object} options - Optional parameters
 * @param {number} options.pageSize - Number of results (default: 50)
 * @returns {Promise<Array>} Array of matching files
 */
async function searchFiles(tokens, query, folderId = null, options = {}) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });

  const { pageSize = 50 } = options;

  let searchQuery = `name contains '${query}' and trashed = false`;
  if (folderId) {
    searchQuery += ` and '${folderId}' in parents`;
  }

  const response = await drive.files.list({
    pageSize,
    q: searchQuery,
    fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)',
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
}

/**
 * Export a Google Workspace file to a specific format
 * @param {Object} tokens - OAuth tokens
 * @param {string} fileId - File ID
 * @param {string} mimeType - Target MIME type (e.g., 'text/plain', 'text/csv', 'application/pdf')
 * @returns {Promise<string>} Exported content
 */
async function exportFile(tokens, fileId, mimeType) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.export(
    { fileId, mimeType },
    { responseType: 'text' }
  );

  return response.data;
}

/**
 * Download a binary file
 * @param {Object} tokens - OAuth tokens
 * @param {string} fileId - File ID
 * @returns {Promise<Buffer>} File content as buffer
 */
async function downloadFile(tokens, fileId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data);
}

/**
 * Get files by type (e.g., all documents, all spreadsheets)
 * @param {Object} tokens - OAuth tokens
 * @param {string} mimeType - MIME type to filter by
 * @param {string|null} folderId - Limit to folder (optional)
 * @param {Object} options - Optional parameters
 * @returns {Promise<Array>} Array of files
 */
async function getFilesByType(tokens, mimeType, folderId = null, options = {}) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });

  const { pageSize = 50 } = options;

  let query = `mimeType = '${mimeType}' and trashed = false`;
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  const response = await drive.files.list({
    pageSize,
    q: query,
    fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)',
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
}

/**
 * Get recent files
 * @param {Object} tokens - OAuth tokens
 * @param {number} limit - Number of files to return (default: 10)
 * @returns {Promise<Array>} Array of recent files
 */
async function getRecentFiles(tokens, limit = 10) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.list({
    pageSize: limit,
    q: 'trashed = false',
    fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)',
    orderBy: 'viewedByMeTime desc',
  });

  return response.data.files || [];
}

// MIME type constants for convenience
const MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  DOCUMENT: 'application/vnd.google-apps.document',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  PRESENTATION: 'application/vnd.google-apps.presentation',
  FORM: 'application/vnd.google-apps.form',
  DRAWING: 'application/vnd.google-apps.drawing',
  PDF: 'application/pdf',
};

module.exports = {
  // Core functions
  listFiles,
  listFolders,
  getFileMetadata,
  searchFiles,
  exportFile,
  downloadFile,

  // Convenience functions
  getFilesByType,
  getRecentFiles,

  // Constants
  MIME_TYPES,
};
