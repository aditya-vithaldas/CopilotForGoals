/**
 * Google Docs Connector
 *
 * Standalone module for interacting with Google Docs API.
 * Can be used independently for testing or integrated into the main app.
 *
 * Usage:
 *   const googleDocs = require('./connectors/googleDocs');
 *
 *   // Get document content as plain text
 *   const doc = await googleDocs.getDocumentContent(tokens, documentId);
 *   console.log(doc.title, doc.content);
 *
 *   // Get document with structured content
 *   const structured = await googleDocs.getDocumentStructured(tokens, documentId);
 */

const { google } = require('googleapis');
const googleAuth = require('./googleAuth');

/**
 * Get document content as plain text
 * @param {Object} tokens - OAuth tokens { accessToken, refreshToken }
 * @param {string} documentId - Google Doc ID
 * @returns {Promise<Object>} { title, content, documentId }
 */
async function getDocumentContent(tokens, documentId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({ documentId });

  // Extract plain text from the document structure
  const content = response.data.body.content;
  let text = '';

  function extractText(elements) {
    for (const element of elements) {
      if (element.paragraph) {
        for (const elem of element.paragraph.elements || []) {
          if (elem.textRun) {
            text += elem.textRun.content;
          }
        }
      } else if (element.table) {
        for (const row of element.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            if (cell.content) {
              extractText(cell.content);
            }
          }
        }
      } else if (element.sectionBreak) {
        text += '\n';
      }
    }
  }

  extractText(content || []);

  return {
    documentId,
    title: response.data.title,
    content: text,
  };
}

/**
 * Get document with full structured content
 * @param {Object} tokens - OAuth tokens
 * @param {string} documentId - Google Doc ID
 * @returns {Promise<Object>} Full document object from API
 */
async function getDocumentStructured(tokens, documentId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({ documentId });
  return response.data;
}

/**
 * Get document metadata only (faster than full content)
 * @param {Object} tokens - OAuth tokens
 * @param {string} documentId - Google Doc ID
 * @returns {Promise<Object>} { documentId, title, revisionId }
 */
async function getDocumentMetadata(tokens, documentId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({
    documentId,
    fields: 'documentId,title,revisionId',
  });

  return response.data;
}

/**
 * Extract headings from document
 * @param {Object} tokens - OAuth tokens
 * @param {string} documentId - Google Doc ID
 * @returns {Promise<Array>} Array of { level, text } objects
 */
async function getDocumentHeadings(tokens, documentId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({ documentId });
  const content = response.data.body.content;
  const headings = [];

  function extractHeadings(elements) {
    for (const element of elements) {
      if (element.paragraph) {
        const style = element.paragraph.paragraphStyle?.namedStyleType;
        if (style && style.startsWith('HEADING_')) {
          const level = parseInt(style.replace('HEADING_', ''), 10);
          let text = '';
          for (const elem of element.paragraph.elements || []) {
            if (elem.textRun) {
              text += elem.textRun.content;
            }
          }
          if (text.trim()) {
            headings.push({ level, text: text.trim() });
          }
        }
      }
    }
  }

  extractHeadings(content || []);
  return headings;
}

/**
 * Extract tables from document
 * @param {Object} tokens - OAuth tokens
 * @param {string} documentId - Google Doc ID
 * @returns {Promise<Array>} Array of tables, each table is array of rows, each row is array of cell text
 */
async function getDocumentTables(tokens, documentId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({ documentId });
  const content = response.data.body.content;
  const tables = [];

  function extractCellText(cellContent) {
    let text = '';
    for (const element of cellContent || []) {
      if (element.paragraph) {
        for (const elem of element.paragraph.elements || []) {
          if (elem.textRun) {
            text += elem.textRun.content;
          }
        }
      }
    }
    return text.trim();
  }

  function extractTables(elements) {
    for (const element of elements) {
      if (element.table) {
        const table = [];
        for (const row of element.table.tableRows || []) {
          const rowData = [];
          for (const cell of row.tableCells || []) {
            rowData.push(extractCellText(cell.content));
          }
          table.push(rowData);
        }
        tables.push(table);
      }
    }
  }

  extractTables(content || []);
  return tables;
}

/**
 * Extract links from document
 * @param {Object} tokens - OAuth tokens
 * @param {string} documentId - Google Doc ID
 * @returns {Promise<Array>} Array of { text, url } objects
 */
async function getDocumentLinks(tokens, documentId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({ documentId });
  const content = response.data.body.content;
  const links = [];

  function extractLinks(elements) {
    for (const element of elements) {
      if (element.paragraph) {
        for (const elem of element.paragraph.elements || []) {
          if (elem.textRun && elem.textRun.textStyle?.link?.url) {
            links.push({
              text: elem.textRun.content.trim(),
              url: elem.textRun.textStyle.link.url,
            });
          }
        }
      } else if (element.table) {
        for (const row of element.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            if (cell.content) {
              extractLinks(cell.content);
            }
          }
        }
      }
    }
  }

  extractLinks(content || []);
  return links;
}

/**
 * Get word count for document
 * @param {Object} tokens - OAuth tokens
 * @param {string} documentId - Google Doc ID
 * @returns {Promise<Object>} { words, characters, paragraphs }
 */
async function getDocumentStats(tokens, documentId) {
  const doc = await getDocumentContent(tokens, documentId);
  const content = doc.content;

  const words = content.split(/\s+/).filter((w) => w.length > 0).length;
  const characters = content.length;
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0).length;

  return { words, characters, paragraphs, title: doc.title };
}

/**
 * Extract all text with formatting info
 * @param {Object} tokens - OAuth tokens
 * @param {string} documentId - Google Doc ID
 * @returns {Promise<Array>} Array of { text, bold, italic, underline, link } objects
 */
async function getFormattedText(tokens, documentId) {
  const auth = googleAuth.getAuthenticatedClient(tokens);
  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({ documentId });
  const content = response.data.body.content;
  const formattedText = [];

  function extractFormatted(elements) {
    for (const element of elements) {
      if (element.paragraph) {
        for (const elem of element.paragraph.elements || []) {
          if (elem.textRun) {
            const style = elem.textRun.textStyle || {};
            formattedText.push({
              text: elem.textRun.content,
              bold: style.bold || false,
              italic: style.italic || false,
              underline: style.underline || false,
              link: style.link?.url || null,
            });
          }
        }
      }
    }
  }

  extractFormatted(content || []);
  return formattedText;
}

module.exports = {
  // Core functions
  getDocumentContent,
  getDocumentStructured,
  getDocumentMetadata,

  // Extraction helpers
  getDocumentHeadings,
  getDocumentTables,
  getDocumentLinks,
  getDocumentStats,
  getFormattedText,
};
