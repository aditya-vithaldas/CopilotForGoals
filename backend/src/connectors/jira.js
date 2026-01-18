/**
 * Jira Connector
 *
 * Standalone module for interacting with Jira REST API.
 * Can be used independently for testing or integrated into the main app.
 *
 * Usage:
 *   const jira = require('./connectors/jira');
 *
 *   // Test connection
 *   const result = await jira.testConnection(jiraUrl, email, apiToken);
 *
 *   // Get boards
 *   const boards = await jira.getBoards(jiraUrl, email, apiToken);
 *
 *   // Get issues for a board
 *   const issues = await jira.getBoardIssues(jiraUrl, email, apiToken, boardId);
 */

const axios = require('axios');

/**
 * Create an authenticated Jira API client
 * @param {string} jiraUrl - Jira instance URL (e.g., https://yourcompany.atlassian.net)
 * @param {string} email - User email
 * @param {string} apiToken - Jira API token
 * @returns {AxiosInstance} Configured axios instance
 */
function createClient(jiraUrl, email, apiToken) {
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  return axios.create({
    baseURL: jiraUrl.replace(/\/$/, ''),
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

/**
 * Test connection and get current user info
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @returns {Promise<Object>} { success: boolean, user?: Object, error?: string }
 */
async function testConnection(jiraUrl, email, apiToken) {
  const client = createClient(jiraUrl, email, apiToken);
  try {
    const response = await client.get('/rest/api/3/myself');
    return {
      success: true,
      user: {
        accountId: response.data.accountId,
        displayName: response.data.displayName,
        email: response.data.emailAddress,
        avatarUrl: response.data.avatarUrls?.['48x48'],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.errorMessages?.[0] || error.message,
    };
  }
}

/**
 * Get all boards
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @returns {Promise<Array>} Array of board objects
 */
async function getBoards(jiraUrl, email, apiToken) {
  const client = createClient(jiraUrl, email, apiToken);
  const response = await client.get('/rest/agile/1.0/board');
  return response.data.values.map((board) => ({
    id: board.id,
    name: board.name,
    type: board.type, // 'scrum' or 'kanban'
    projectKey: board.location?.projectKey,
    projectName: board.location?.projectName,
  }));
}

/**
 * Get board details
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {number} boardId - Board ID
 * @returns {Promise<Object>} Board details
 */
async function getBoard(jiraUrl, email, apiToken, boardId) {
  const client = createClient(jiraUrl, email, apiToken);
  const response = await client.get(`/rest/agile/1.0/board/${boardId}`);
  return {
    id: response.data.id,
    name: response.data.name,
    type: response.data.type,
    projectKey: response.data.location?.projectKey,
  };
}

/**
 * Get board configuration (columns/statuses)
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {number} boardId - Board ID
 * @returns {Promise<Object>} Board configuration with columns
 */
async function getBoardConfiguration(jiraUrl, email, apiToken, boardId) {
  const client = createClient(jiraUrl, email, apiToken);
  try {
    const response = await client.get(`/rest/agile/1.0/board/${boardId}/configuration`);
    return {
      columns:
        response.data.columnConfig?.columns?.map((col) => ({
          name: col.name,
          statuses: col.statuses?.map((s) => s.id) || [],
        })) || [],
    };
  } catch (error) {
    // Return default columns if config not available
    return {
      columns: [
        { name: 'To Do', statuses: [] },
        { name: 'In Progress', statuses: [] },
        { name: 'Done', statuses: [] },
      ],
    };
  }
}

/**
 * Get issues for a board
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {number} boardId - Board ID
 * @param {Object} options - Optional parameters
 * @param {number} options.maxResults - Maximum issues to return (default: 50)
 * @param {number} options.startAt - Pagination offset
 * @returns {Promise<Array>} Array of issue objects
 */
async function getBoardIssues(jiraUrl, email, apiToken, boardId, options = {}) {
  const client = createClient(jiraUrl, email, apiToken);
  const { maxResults = 50, startAt = 0 } = options;

  const response = await client.get(`/rest/agile/1.0/board/${boardId}/issue`, {
    params: { maxResults, startAt },
  });

  return response.data.issues.map((issue) => formatIssue(issue));
}

/**
 * Get active sprint for a board
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {number} boardId - Board ID
 * @returns {Promise<Object|null>} Active sprint or null
 */
async function getActiveSprint(jiraUrl, email, apiToken, boardId) {
  const client = createClient(jiraUrl, email, apiToken);
  try {
    const response = await client.get(`/rest/agile/1.0/board/${boardId}/sprint`, {
      params: { state: 'active' },
    });
    if (response.data.values && response.data.values.length > 0) {
      const sprint = response.data.values[0];
      return {
        id: sprint.id,
        name: sprint.name,
        state: sprint.state,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        goal: sprint.goal,
      };
    }
    return null;
  } catch (error) {
    // Board might not have sprints (Kanban)
    return null;
  }
}

/**
 * Get all sprints for a board
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {number} boardId - Board ID
 * @param {string} state - Sprint state filter: 'active', 'closed', 'future', or null for all
 * @returns {Promise<Array>} Array of sprint objects
 */
async function getSprints(jiraUrl, email, apiToken, boardId, state = null) {
  const client = createClient(jiraUrl, email, apiToken);
  const params = {};
  if (state) params.state = state;

  try {
    const response = await client.get(`/rest/agile/1.0/board/${boardId}/sprint`, { params });
    return response.data.values.map((sprint) => ({
      id: sprint.id,
      name: sprint.name,
      state: sprint.state,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      goal: sprint.goal,
      originBoardId: sprint.originBoardId,
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Get issues for a sprint
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {number} sprintId - Sprint ID
 * @returns {Promise<Array>} Array of issue objects
 */
async function getSprintIssues(jiraUrl, email, apiToken, sprintId) {
  const client = createClient(jiraUrl, email, apiToken);
  const response = await client.get(`/rest/agile/1.0/sprint/${sprintId}/issue`);
  return response.data.issues.map((issue) => formatIssue(issue));
}

/**
 * Get epics for a board
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {number} boardId - Board ID
 * @returns {Promise<Array>} Array of epic objects
 */
async function getEpics(jiraUrl, email, apiToken, boardId) {
  const client = createClient(jiraUrl, email, apiToken);
  try {
    const response = await client.get(`/rest/agile/1.0/board/${boardId}/epic`);
    return response.data.values.map((epic) => ({
      id: epic.id,
      key: epic.key,
      name: epic.name,
      summary: epic.summary,
      done: epic.done,
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Get issues for an epic
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {number} epicId - Epic ID
 * @returns {Promise<Array>} Array of issue objects
 */
async function getEpicIssues(jiraUrl, email, apiToken, epicId) {
  const client = createClient(jiraUrl, email, apiToken);
  const response = await client.get(`/rest/agile/1.0/epic/${epicId}/issue`);
  return response.data.issues.map((issue) => formatIssue(issue));
}

/**
 * Get a single issue by key or ID
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {string} issueKeyOrId - Issue key (e.g., 'PROJ-123') or ID
 * @returns {Promise<Object>} Issue details
 */
async function getIssue(jiraUrl, email, apiToken, issueKeyOrId) {
  const client = createClient(jiraUrl, email, apiToken);
  const response = await client.get(`/rest/api/3/issue/${issueKeyOrId}`);
  return formatIssue(response.data);
}

/**
 * Search issues using JQL
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {string} jql - JQL query string
 * @param {Object} options - Optional parameters
 * @param {number} options.maxResults - Maximum results (default: 50)
 * @param {number} options.startAt - Pagination offset
 * @returns {Promise<Object>} { issues: Array, total: number }
 */
async function searchIssues(jiraUrl, email, apiToken, jql, options = {}) {
  const client = createClient(jiraUrl, email, apiToken);
  const { maxResults = 50, startAt = 0 } = options;

  const response = await client.get('/rest/api/3/search', {
    params: {
      jql,
      maxResults,
      startAt,
      fields: 'summary,status,priority,assignee,issuetype,created,updated,description',
    },
  });

  return {
    issues: response.data.issues.map((issue) => formatIssue(issue)),
    total: response.data.total,
    startAt: response.data.startAt,
    maxResults: response.data.maxResults,
  };
}

/**
 * Get recent tickets for a board
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {number} boardId - Board ID
 * @param {number} limit - Number of tickets (default: 4)
 * @returns {Promise<Array>} Array of recent issues
 */
async function getRecentTickets(jiraUrl, email, apiToken, boardId, limit = 4) {
  try {
    const issues = await getBoardIssues(jiraUrl, email, apiToken, boardId, {
      maxResults: 50,
    });
    return issues.sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, limit);
  } catch (error) {
    return [];
  }
}

/**
 * Get projects accessible to the user
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @returns {Promise<Array>} Array of project objects
 */
async function getProjects(jiraUrl, email, apiToken) {
  const client = createClient(jiraUrl, email, apiToken);
  const response = await client.get('/rest/api/3/project');
  return response.data.map((project) => ({
    id: project.id,
    key: project.key,
    name: project.name,
    projectTypeKey: project.projectTypeKey,
    avatarUrl: project.avatarUrls?.['48x48'],
  }));
}

/**
 * Get issue types for a project
 * @param {string} jiraUrl - Jira instance URL
 * @param {string} email - User email
 * @param {string} apiToken - API token
 * @param {string} projectKey - Project key
 * @returns {Promise<Array>} Array of issue type objects
 */
async function getIssueTypes(jiraUrl, email, apiToken, projectKey) {
  const client = createClient(jiraUrl, email, apiToken);
  const response = await client.get(`/rest/api/3/project/${projectKey}/statuses`);
  return response.data.map((issueType) => ({
    id: issueType.id,
    name: issueType.name,
    statuses: issueType.statuses.map((s) => ({
      id: s.id,
      name: s.name,
      statusCategory: s.statusCategory?.name,
    })),
  }));
}

/**
 * Format issue object for consistent output
 * @param {Object} issue - Raw issue from Jira API
 * @returns {Object} Formatted issue
 */
function formatIssue(issue) {
  return {
    id: issue.id,
    key: issue.key,
    summary: issue.fields?.summary,
    description: issue.fields?.description,
    status: issue.fields?.status?.name,
    statusCategory: issue.fields?.status?.statusCategory?.name,
    priority: issue.fields?.priority?.name,
    assignee: issue.fields?.assignee?.displayName,
    assigneeAvatar: issue.fields?.assignee?.avatarUrls?.['24x24'],
    reporter: issue.fields?.reporter?.displayName,
    issueType: issue.fields?.issuetype?.name,
    issueTypeIcon: issue.fields?.issuetype?.iconUrl,
    created: issue.fields?.created,
    updated: issue.fields?.updated,
    storyPoints: issue.fields?.customfield_10016, // Common story points field
    labels: issue.fields?.labels || [],
  };
}

// JQL query helpers
const JQL = {
  myOpenIssues: 'assignee = currentUser() AND resolution = Unresolved',
  recentlyUpdated: 'updated >= -7d ORDER BY updated DESC',
  createdThisWeek: 'created >= startOfWeek()',
  highPriority: 'priority in (Highest, High)',
  unassigned: 'assignee is EMPTY',
  inProgress: 'status = "In Progress"',
  done: 'status = Done',
};

module.exports = {
  // Connection
  createClient,
  testConnection,

  // Boards
  getBoards,
  getBoard,
  getBoardConfiguration,
  getBoardIssues,

  // Sprints
  getActiveSprint,
  getSprints,
  getSprintIssues,

  // Epics
  getEpics,
  getEpicIssues,

  // Issues
  getIssue,
  searchIssues,
  getRecentTickets,

  // Projects
  getProjects,
  getIssueTypes,

  // Helpers
  JQL,
};
