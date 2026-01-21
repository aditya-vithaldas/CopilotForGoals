/**
 * Google OAuth Authentication Module
 *
 * Shared authentication utilities for all Google services.
 * This module handles OAuth2 flow and token management.
 *
 * Usage:
 *   const googleAuth = require('./connectors/googleAuth');
 *   const authUrl = googleAuth.getAuthUrl({ goalId: '123', connectionType: 'gmail' });
 *   const tokens = await googleAuth.getTokens(code);
 *   const client = googleAuth.getAuthenticatedClient(tokens);
 */

const { google } = require('googleapis');

// OAuth Configuration - use environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

// All scopes needed across Google services
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Create base OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

/**
 * Generate OAuth authorization URL
 * @param {Object} state - State object to pass through OAuth flow (e.g., { goalId, connectionType })
 * @param {string} customRedirectUri - Optional custom redirect URI
 * @returns {string} Authorization URL
 */
function getAuthUrl(state, customRedirectUri = null) {
  const stateString = typeof state === 'string' ? state : JSON.stringify(state);

  if (customRedirectUri) {
    // Create a new client with custom redirect URI
    const customClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, customRedirectUri);
    return customClient.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: stateString,
      prompt: 'consent',
    });
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: stateString,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from OAuth callback
 * @param {string} customRedirectUri - Optional custom redirect URI (must match the one used in getAuthUrl)
 * @returns {Promise<Object>} Token object with access_token, refresh_token, expiry_date
 */
async function getTokens(code, customRedirectUri = null) {
  if (customRedirectUri) {
    const customClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, customRedirectUri);
    const { tokens } = await customClient.getToken(code);
    return tokens;
  }
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Create an authenticated OAuth2 client from tokens
 * @param {Object} tokens - Token object with access_token and refresh_token
 * @returns {OAuth2Client} Authenticated Google OAuth2 client
 */
function getAuthenticatedClient(tokens) {
  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  client.setCredentials({
    access_token: tokens.access_token || tokens.accessToken,
    refresh_token: tokens.refresh_token || tokens.refreshToken,
  });
  return client;
}

/**
 * Get user profile information
 * @param {Object} tokens - Token object
 * @returns {Promise<Object>} User info with email, name, picture
 */
async function getUserInfo(tokens) {
  const auth = getAuthenticatedClient(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth });
  const { data } = await oauth2.userinfo.get();
  return data;
}

/**
 * Check if tokens have a specific scope
 * @param {Object} tokens - Token object
 * @param {string} scope - Scope URL to check
 * @returns {Promise<boolean>} True if scope is available
 */
async function hasScope(tokens, scope) {
  try {
    const auth = getAuthenticatedClient(tokens);
    const tokenInfo = await auth.getTokenInfo(tokens.access_token || tokens.accessToken);
    return tokenInfo.scopes && tokenInfo.scopes.includes(scope);
  } catch (error) {
    return false;
  }
}

// Export configuration for reference
module.exports = {
  // Auth functions
  getAuthUrl,
  getTokens,
  getAuthenticatedClient,
  getUserInfo,
  hasScope,

  // Configuration (for reference/testing)
  config: {
    CLIENT_ID,
    REDIRECT_URI,
    SCOPES,
  },
};
