import axios from 'axios';
import type { Goal, Connection, ConnectionType, ConnectionConfig, FileItem, Suggestion } from '../types';

// Use relative URL in production (same origin), localhost in development
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Goals API
export const goalsApi = {
  getAll: async (): Promise<Goal[]> => {
    const { data } = await api.get('/goals');
    return data;
  },

  getById: async (id: string): Promise<Goal> => {
    const { data } = await api.get(`/goals/${id}`);
    return data;
  },

  create: async (name: string, description?: string): Promise<Goal> => {
    const { data } = await api.post('/goals', { name, description });
    return data;
  },

  update: async (id: string, name: string, description?: string): Promise<Goal> => {
    const { data } = await api.put(`/goals/${id}`, { name, description });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`);
  },

  generateSuggestions: async (goalId: string): Promise<Suggestion[]> => {
    const { data } = await api.post(`/goals/${goalId}/generate-suggestions`);
    return data;
  },
};

// Connections API
export const connectionsApi = {
  getForGoal: async (goalId: string): Promise<Connection[]> => {
    const { data } = await api.get(`/goals/${goalId}/connections`);
    return data;
  },

  create: async (goalId: string, type: ConnectionType, name: string, config: ConnectionConfig): Promise<Connection> => {
    const { data } = await api.post(`/goals/${goalId}/connections`, { type, name, config });
    return data;
  },

  update: async (id: string, name: string, config: ConnectionConfig, status?: string): Promise<Connection> => {
    const { data } = await api.put(`/connections/${id}`, { name, config, status });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/connections/${id}`);
  },
};

// Files API
export const filesApi = {
  getForConnection: async (connectionId: string): Promise<FileItem[]> => {
    const { data } = await api.get(`/connections/${connectionId}/files`);
    return data;
  },

  create: async (
    connectionId: string,
    name: string,
    fileType: string,
    externalId?: string,
    content?: string,
    metadata?: Record<string, unknown>
  ): Promise<FileItem> => {
    const { data } = await api.post(`/connections/${connectionId}/files`, {
      name,
      file_type: fileType,
      external_id: externalId,
      content,
      metadata,
    });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/files/${id}`);
  },
};

// Suggestions API
export const suggestionsApi = {
  getForGoal: async (goalId: string): Promise<Suggestion[]> => {
    const { data } = await api.get(`/goals/${goalId}/suggestions`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/suggestions/${id}`);
  },
};

// Google Auth API
export const googleApi = {
  getAuthUrl: async (goalId: string, connectionType: 'google_docs' | 'google_drive'): Promise<string> => {
    const { data } = await api.get('/auth/google', {
      params: { goalId, connectionType },
    });
    return data.authUrl;
  },
};

// Google Drive API
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export const driveApi = {
  listFiles: async (connectionId: string, folderId?: string): Promise<{ files: DriveFile[]; nextPageToken?: string }> => {
    const { data } = await api.get(`/connections/${connectionId}/drive/files`, {
      params: { folderId },
    });
    return data;
  },

  listFolders: async (connectionId: string, parentId?: string): Promise<DriveFile[]> => {
    const { data } = await api.get(`/connections/${connectionId}/drive/folders`, {
      params: { parentId },
    });
    return data;
  },

  searchFiles: async (connectionId: string, query: string, folderId?: string): Promise<DriveFile[]> => {
    const { data } = await api.get(`/connections/${connectionId}/drive/search`, {
      params: { query, folderId },
    });
    return data;
  },

  setFolder: async (connectionId: string, folderId: string, folderName: string): Promise<void> => {
    await api.put(`/connections/${connectionId}/drive/folder`, { folderId, folderName });
  },

  importFile: async (connectionId: string, fileId: string, fileName: string, mimeType: string): Promise<FileItem> => {
    const { data } = await api.post(`/connections/${connectionId}/import`, { fileId, fileName, mimeType });
    return data;
  },
};

// Google Docs API
export const docsApi = {
  getContent: async (connectionId: string, documentId: string): Promise<{ title: string; content: string }> => {
    const { data } = await api.get(`/connections/${connectionId}/docs/${documentId}`);
    return data;
  },
};

// Chat API (Gemini)
export const chatApi = {
  setApiKey: async (apiKey: string): Promise<void> => {
    await api.post('/chat/config', { apiKey });
  },

  send: async (goalId: string, message: string, history: { role: string; content: string }[] = []): Promise<{ message: string }> => {
    const { data } = await api.post(`/goals/${goalId}/chat`, { message, history });
    return data;
  },

  summarize: async (fileId: string): Promise<{ summary: string; file: { id: string; name: string; goal_id: string } }> => {
    const { data } = await api.post(`/files/${fileId}/summarize`);
    return data;
  },

  extractPoints: async (fileId: string): Promise<{ points: string; file: { id: string; name: string; goal_id: string } }> => {
    const { data } = await api.post(`/files/${fileId}/extract-points`);
    return data;
  },
};

// Widgets API
export interface Widget {
  id: string;
  goal_id: string;
  file_id?: string;
  widget_type: 'summary' | 'key_points' | 'chart' | 'custom' | 'sprint_stats' | 'kanban_overview' | 'recent_tickets' | 'gantt_chart' | 'search_results' | 'label_emails' | 'inbox_summary' | 'unread_count' | 'recent_emails';
  title: string;
  content: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const widgetsApi = {
  getForGoal: async (goalId: string): Promise<Widget[]> => {
    const { data } = await api.get(`/goals/${goalId}/widgets`);
    return data;
  },

  create: async (goalId: string, widget: { file_id?: string; widget_type: string; title: string; content: string; config?: Record<string, unknown> }): Promise<Widget> => {
    const { data } = await api.post(`/goals/${goalId}/widgets`, widget);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/widgets/${id}`);
  },

  update: async (id: string, updates: { config?: Record<string, unknown>; content?: string; title?: string }): Promise<Widget> => {
    const { data } = await api.patch(`/widgets/${id}`, updates);
    return data;
  },

  refresh: async (id: string): Promise<Widget> => {
    const { data } = await api.post(`/widgets/${id}/refresh`);
    return data;
  },

  reorder: async (positions: { id: string; position: number }[]): Promise<void> => {
    await api.post('/widgets/reorder', { positions });
  },
};

// Jira API
export interface JiraBoard {
  id: number;
  name: string;
  type: 'scrum' | 'kanban';
  projectKey?: string;
  projectName?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  priority?: string;
  assignee?: string;
  issueType?: string;
  created: string;
  updated: string;
  storyPoints?: number;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
}

export interface JiraEpic {
  id: number;
  key: string;
  name: string;
  summary: string;
  done: boolean;
}

export interface JiraTestResult {
  success: boolean;
  user?: {
    accountId: string;
    displayName: string;
    email: string;
  };
  error?: string;
}

export const jiraApi = {
  testConnection: async (jiraUrl: string, email: string, apiToken: string): Promise<JiraTestResult> => {
    const { data } = await api.post('/jira/test', { jiraUrl, email, apiToken });
    return data;
  },

  getBoards: async (jiraUrl: string, email: string, apiToken: string): Promise<JiraBoard[]> => {
    const { data } = await api.post('/jira/boards', { jiraUrl, email, apiToken });
    return data;
  },

  getIssues: async (connectionId: string): Promise<JiraIssue[]> => {
    const { data } = await api.get(`/connections/${connectionId}/jira/issues`);
    return data;
  },

  getConfig: async (connectionId: string): Promise<{ columns: { name: string; statuses: string[] }[] }> => {
    const { data } = await api.get(`/connections/${connectionId}/jira/config`);
    return data;
  },

  getSprint: async (connectionId: string): Promise<JiraSprint | null> => {
    const { data } = await api.get(`/connections/${connectionId}/jira/sprint`);
    return data.sprint;
  },

  getEpics: async (connectionId: string): Promise<JiraEpic[]> => {
    const { data } = await api.get(`/connections/${connectionId}/jira/epics`);
    return data;
  },

  getRecentTickets: async (connectionId: string): Promise<JiraIssue[]> => {
    const { data } = await api.get(`/connections/${connectionId}/jira/recent`);
    return data;
  },
};

// Gmail API
export interface GmailEmail {
  id: string;
  threadId: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  date: string;
  snippet: string;
  textBody?: string;
  htmlBody?: string;
  labelIds: string[];
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  isUnread?: boolean;
  isStarred?: boolean;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
}

export const gmailApi = {
  listEmails: async (connectionId: string, query?: string, maxResults?: number): Promise<GmailEmail[]> => {
    const { data } = await api.get(`/connections/${connectionId}/gmail/messages`, {
      params: { query, maxResults },
    });
    return data;
  },

  getEmail: async (connectionId: string, messageId: string): Promise<GmailEmail> => {
    const { data } = await api.get(`/connections/${connectionId}/gmail/messages/${messageId}`);
    return data;
  },

  searchEmails: async (connectionId: string, query: string, maxResults?: number): Promise<GmailEmail[]> => {
    const { data } = await api.get(`/connections/${connectionId}/gmail/search`, {
      params: { query, maxResults },
    });
    return data;
  },

  getLabels: async (connectionId: string): Promise<GmailLabel[]> => {
    const { data } = await api.get(`/connections/${connectionId}/gmail/labels`);
    return data;
  },
};

// Todos API
export interface Todo {
  id: string;
  goal_id: string;
  text: string;
  completed: number;
  source?: string;
  created_at: string;
  updated_at: string;
}

export const todosApi = {
  getForGoal: async (goalId: string): Promise<Todo[]> => {
    const { data } = await api.get(`/goals/${goalId}/todos`);
    return data;
  },

  create: async (goalId: string, text: string, source?: string): Promise<Todo> => {
    const { data } = await api.post(`/goals/${goalId}/todos`, { text, source });
    return data;
  },

  toggle: async (id: string, completed?: boolean): Promise<Todo> => {
    const { data } = await api.patch(`/todos/${id}`, { completed });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/todos/${id}`);
  },
};
