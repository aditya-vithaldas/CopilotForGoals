export type ConnectionType = 'google_docs' | 'google_drive' | 'gmail' | 'jira' | 'mysql' | 'confluence' | 'whatsapp';

export interface Goal {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  connection_count?: number;
  file_count?: number;
  connections?: Connection[];
  files?: FileItem[];
  suggestions?: Suggestion[];
}

export interface Connection {
  id: string;
  goal_id: string;
  type: ConnectionType;
  name: string;
  config: ConnectionConfig;
  status: 'connected' | 'disconnected' | 'error';
  created_at: string;
  updated_at: string;
}

export interface ConnectionConfig {
  // Google Docs / Drive
  accessToken?: string;
  folderId?: string;
  folderName?: string;

  // Jira
  jiraUrl?: string;
  projectKey?: string;
  boardId?: string;
  boardName?: string;
  email?: string;
  apiToken?: string;

  // MySQL
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;

  // Confluence
  confluenceUrl?: string;
  spaceKey?: string;
  spaceName?: string;

  // WhatsApp
  phoneNumber?: string;
  whatsappApiKey?: string;
  refreshToken?: string;
}

export interface FileItem {
  id: string;
  connection_id: string;
  goal_id: string;
  name: string;
  file_type: string;
  external_id: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Suggestion {
  id: string;
  goal_id: string;
  connection_id?: string;
  file_id?: string;
  title: string;
  description: string;
  action_type: string;
  action_config: Record<string, unknown>;
  created_at: string;
}
