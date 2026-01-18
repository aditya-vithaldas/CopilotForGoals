import { useState } from 'react';
import { X, FileText, FolderOpen, LayoutGrid, Database, BookOpen, Loader2, User, Plus, CheckCircle, AlertCircle, Mail, MessageCircle } from 'lucide-react';
import type { Connection, ConnectionType } from '../types';
import { googleApi, jiraApi, type JiraBoard } from '../services/api';

interface AddConnectionModalProps {
  goalId: string;
  existingConnections?: Connection[];
  onClose: () => void;
  onAdd: (type: ConnectionType, name: string, config: Record<string, unknown>) => void | Promise<void>;
  onUseExisting?: (connection: Connection, mode: 'folder' | 'files') => void;
}

type ConnectionOption = {
  type: ConnectionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  usesOAuth?: boolean;
};

const connectionOptions: ConnectionOption[] = [
  {
    type: 'google_docs',
    label: 'Google Docs',
    description: 'Connect individual documents from Google Docs',
    icon: <FileText className="w-6 h-6" />,
    usesOAuth: true,
  },
  {
    type: 'google_drive',
    label: 'Google Drive',
    description: 'Connect a folder from Google Drive',
    icon: <FolderOpen className="w-6 h-6" />,
    usesOAuth: true,
  },
  {
    type: 'gmail',
    label: 'Gmail',
    description: 'Connect to your Gmail inbox for email context',
    icon: <Mail className="w-6 h-6" />,
    usesOAuth: true,
  },
  {
    type: 'jira',
    label: 'Jira',
    description: 'Connect to a Jira board for tickets and planning',
    icon: <LayoutGrid className="w-6 h-6" />,
  },
  {
    type: 'mysql',
    label: 'MySQL Database',
    description: 'Connect to a MySQL database for reports',
    icon: <Database className="w-6 h-6" />,
  },
  {
    type: 'confluence',
    label: 'Confluence Wiki',
    description: 'Connect to a Confluence space',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    description: 'Connect to WhatsApp for messaging context',
    icon: <MessageCircle className="w-6 h-6" />,
  },
];

export default function AddConnectionModal({ goalId, existingConnections = [], onClose, onAdd, onUseExisting }: AddConnectionModalProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'choose-google-account' | 'jira-boards'>('select');
  const [selectedType, setSelectedType] = useState<ConnectionType | null>(null);
  const [connectionName, setConnectionName] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [connectingToGoogle, setConnectingToGoogle] = useState(false);
  const [addingGmail, setAddingGmail] = useState(false);

  // Jira-specific state
  const [jiraTestStatus, setJiraTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [jiraTestError, setJiraTestError] = useState<string>('');
  const [jiraUser, setJiraUser] = useState<{ displayName: string; email: string } | null>(null);
  const [jiraBoards, setJiraBoards] = useState<JiraBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<JiraBoard | null>(null);
  const [loadingBoards, setLoadingBoards] = useState(false);

  // Find existing Google connections
  const existingGoogleConnections = existingConnections.filter(
    c => c.type === 'google_drive' || c.type === 'google_docs' || c.type === 'gmail'
  );

  const handleSelectType = async (type: ConnectionType) => {
    const option = connectionOptions.find(o => o.type === type);
    console.log('handleSelectType called:', { type, hasExistingGoogle: existingGoogleConnections.length > 0 });

    // For Google OAuth connections
    if (option?.usesOAuth) {
      // Check if there are existing Google connections we can reuse
      // For Gmail, we only need the existing connection (no need for onUseExisting since we handle it directly)
      if (existingGoogleConnections.length > 0) {
        console.log('Has existing Google connections, showing account selection');
        setSelectedType(type);
        setStep('choose-google-account');
        return;
      }

      // No existing connections, go through OAuth
      console.log('No existing connections, redirecting to OAuth');
      setConnectingToGoogle(true);
      try {
        const authUrl = await googleApi.getAuthUrl(goalId, type as 'google_docs' | 'google_drive');
        window.location.href = authUrl;
      } catch (error) {
        console.error('Failed to get Google auth URL:', error);
        setConnectingToGoogle(false);
      }
      return;
    }

    setSelectedType(type);
    setConnectionName(option?.label || '');
    setStep('configure');
  };

  const handleUseExistingAccount = async (connection: Connection) => {
    console.log('handleUseExistingAccount called with:', {
      selectedType,
      connectionName: connection.name,
      connectionType: connection.type,
      hasAccessToken: !!connection.config?.accessToken,
      hasRefreshToken: !!connection.config?.refreshToken,
      email: connection.config?.email,
      configKeys: Object.keys(connection.config || {})
    });

    // For Gmail, create the connection directly without file picker
    if (selectedType === 'gmail') {
      const email = connection.config?.email || connection.name || 'Gmail';
      console.log('Creating Gmail connection with:', {
        email,
        hasAccessToken: !!connection.config?.accessToken,
        hasRefreshToken: !!connection.config?.refreshToken,
      });

      if (!connection.config?.accessToken) {
        console.error('No access token found in connection config!');
        alert('Unable to connect Gmail: No access token found. Please try connecting a new Google account.');
        return;
      }

      // Show loading state while adding Gmail
      setAddingGmail(true);
      try {
        await onAdd('gmail', `Gmail (${email})`, {
          accessToken: connection.config?.accessToken,
          refreshToken: connection.config?.refreshToken,
          email: connection.config?.email || email,
        });
        // onAdd will close the modal on success
      } catch (error) {
        console.error('Failed to add Gmail connection:', error);
        setAddingGmail(false);
        alert('Failed to connect Gmail. Please try again.');
      }
      return;
    }

    if (onUseExisting) {
      const mode = selectedType === 'google_drive' ? 'folder' : 'files';
      console.log('Calling onUseExisting with mode:', mode);
      onUseExisting(connection, mode);
    } else {
      console.warn('onUseExisting is not defined');
    }
  };

  const handleConnectNewAccount = async () => {
    if (!selectedType) return;
    setConnectingToGoogle(true);
    try {
      const authUrl = await googleApi.getAuthUrl(goalId, selectedType as 'google_docs' | 'google_drive');
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to get Google auth URL:', error);
      setConnectingToGoogle(false);
    }
  };

  const handleTestJiraConnection = async () => {
    if (!config.jiraUrl || !config.email || !config.apiToken) return;

    setJiraTestStatus('testing');
    setJiraTestError('');

    try {
      const result = await jiraApi.testConnection(config.jiraUrl, config.email, config.apiToken);

      if (result.success && result.user) {
        setJiraTestStatus('success');
        setJiraUser({ displayName: result.user.displayName, email: result.user.email });

        // Auto-load boards after successful connection test
        setLoadingBoards(true);
        try {
          const boards = await jiraApi.getBoards(config.jiraUrl, config.email, config.apiToken);
          setJiraBoards(boards);
          setStep('jira-boards');
        } catch (boardError) {
          console.error('Failed to load boards:', boardError);
          setJiraTestError('Connected but failed to load boards');
        } finally {
          setLoadingBoards(false);
        }
      } else {
        setJiraTestStatus('error');
        setJiraTestError(result.error || 'Failed to connect');
      }
    } catch (error: any) {
      setJiraTestStatus('error');
      const errorMessage = error.response?.data?.error || error.message || 'Failed to connect to Jira';
      setJiraTestError(errorMessage);
      console.error('Jira connection error:', error);
    }
  };

  const handleSelectJiraBoard = (board: JiraBoard) => {
    setSelectedBoard(board);
  };

  const handleSubmitJiraConnection = () => {
    if (!selectedBoard) return;

    onAdd('jira', selectedBoard.name, {
      jiraUrl: config.jiraUrl,
      email: config.email,
      apiToken: config.apiToken,
      boardId: String(selectedBoard.id),
      boardName: selectedBoard.name,
      boardType: selectedBoard.type,
      projectKey: selectedBoard.projectKey || '',
      projectName: selectedBoard.projectName || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !connectionName) return;
    onAdd(selectedType, connectionName, config);
  };

  const renderChooseGoogleAccount = () => {
    // Get unique Google accounts by email OR by connection if no email
    const uniqueAccounts = existingGoogleConnections.reduce((acc, conn) => {
      const email = conn.config?.email;
      // Include connections even if they don't have email stored
      if (email) {
        if (!acc.find(c => c.config?.email === email)) {
          acc.push(conn);
        }
      } else if (!acc.find(c => !c.config?.email)) {
        // Add at least one connection without email
        acc.push(conn);
      }
      return acc;
    }, [] as Connection[]);

    // If no accounts found, use the first existing connection
    if (uniqueAccounts.length === 0 && existingGoogleConnections.length > 0) {
      uniqueAccounts.push(existingGoogleConnections[0]);
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          {selectedType === 'google_drive'
            ? 'Select a Google account to browse folders from:'
            : selectedType === 'gmail'
            ? 'Select a Google account to connect Gmail:'
            : 'Select a Google account to select documents from:'}
        </p>

        {/* Existing accounts */}
        <div className="space-y-2">
          {uniqueAccounts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No Google accounts found. Please connect a new account.</p>
          ) : (
            uniqueAccounts.map((conn) => (
              <button
                key={conn.id}
                onClick={() => handleUseExistingAccount(conn)}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{conn.config?.email || conn.name || 'Google Account'}</h3>
                  <p className="text-sm text-gray-500">Use existing connection</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Connect new account option */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleConnectNewAccount}
            className="w-full flex items-center gap-4 p-4 border border-dashed border-gray-300 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Connect a different account</h3>
              <p className="text-sm text-gray-500">Sign in with another Google account</p>
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderJiraBoards = () => {
    return (
      <div className="space-y-4">
        {jiraUser && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">
              Connected as {jiraUser.displayName}
            </span>
          </div>
        )}

        <p className="text-sm text-gray-600">
          Select a board to add to your goal:
        </p>

        {loadingBoards ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Loading boards...</span>
          </div>
        ) : jiraBoards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No boards found in this Jira instance.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {jiraBoards.map((board) => (
              <button
                key={board.id}
                onClick={() => handleSelectJiraBoard(board)}
                className={`w-full flex items-center gap-4 p-4 border rounded-lg transition-colors text-left ${
                  selectedBoard?.id === board.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  board.type === 'scrum' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{board.name}</h3>
                  <p className="text-sm text-gray-500">
                    {board.projectName || board.projectKey} &bull; {board.type === 'scrum' ? 'Scrum' : 'Kanban'}
                  </p>
                </div>
                {selectedBoard?.id === board.id && (
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderConfigForm = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case 'jira':
        return (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Enter your Jira credentials to connect. You can get an API token from your <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Atlassian account settings</a>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jira Instance URL
              </label>
              <input
                type="url"
                value={config.jiraUrl || ''}
                onChange={(e) => setConfig({ ...config, jiraUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://company.atlassian.net"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={config.email || ''}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="user@company.com"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                type="password"
                value={config.apiToken || ''}
                onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your Jira API token"
              />
            </div>

            {/* Test Connection Status */}
            {jiraTestStatus === 'success' && jiraUser && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">
                  Connected as {jiraUser.displayName}
                </span>
              </div>
            )}

            {jiraTestStatus === 'error' && jiraTestError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700">{jiraTestError}</span>
              </div>
            )}
          </>
        );

      case 'mysql':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection Name
              </label>
              <input
                type="text"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Production Database"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host
                </label>
                <input
                  type="text"
                  value={config.host || ''}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="localhost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="text"
                  value={config.port || ''}
                  onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="3306"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database Name
              </label>
              <input
                type="text"
                value={config.database || ''}
                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="myapp_production"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={config.username || ''}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="db_user"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={config.password || ''}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="********"
              />
            </div>
          </>
        );

      case 'confluence':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection Name
              </label>
              <input
                type="text"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Team Wiki"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confluence URL
              </label>
              <input
                type="url"
                value={config.confluenceUrl || ''}
                onChange={(e) => setConfig({ ...config, confluenceUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://company.atlassian.net/wiki"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Space Key
              </label>
              <input
                type="text"
                value={config.spaceKey || ''}
                onChange={(e) => setConfig({ ...config, spaceKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="PROJ"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Space Name
              </label>
              <input
                type="text"
                value={config.spaceName || ''}
                onChange={(e) => setConfig({ ...config, spaceName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Project Documentation"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={config.email || ''}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="user@company.com"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                type="password"
                value={config.apiToken || ''}
                onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your Confluence API token"
              />
            </div>
          </>
        );

      case 'whatsapp':
        return (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Connect to WhatsApp by scanning a QR code, just like WhatsApp Web. This will allow you to access your chat history and messages.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection Name
              </label>
              <input
                type="text"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="My WhatsApp"
              />
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 mb-1">How it works</h4>
                  <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                    <li>Click "Connect WhatsApp" below</li>
                    <li>Scan the QR code with your phone's WhatsApp</li>
                    <li>Your chats will be synced automatically</li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <strong>Note:</strong> Your phone must stay connected to the internet for the sync to work.
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (connectingToGoogle) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to Google...</p>
        </div>
      </div>
    );
  }

  if (addingGmail) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Connecting Gmail...</p>
        </div>
      </div>
    );
  }

  const getStepTitle = () => {
    if (step === 'select') return 'Add Connection';
    if (step === 'choose-google-account') {
      return selectedType === 'google_drive' ? 'Select Google Account' : 'Select Google Account';
    }
    if (step === 'jira-boards') return 'Select Jira Board';
    return `Configure ${connectionOptions.find(o => o.type === selectedType)?.label}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {getStepTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {step === 'select' ? (
            <div className="space-y-2">
              {connectionOptions.map((option) => {
                // Check if there's an existing connection of this specific type
                const hasExactTypeConnection = existingConnections.some(c => c.type === option.type);
                // Check if we can reuse existing Google OAuth (for Drive/Docs/Gmail from same account)
                const canReuseGoogleAuth = option.usesOAuth && existingGoogleConnections.length > 0 && !hasExactTypeConnection;

                return (
                  <button
                    key={option.type}
                    onClick={() => handleSelectType(option.type)}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      option.usesOAuth ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{option.label}</h3>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                    {hasExactTypeConnection && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Connected
                      </span>
                    )}
                    {canReuseGoogleAuth && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Quick Add
                      </span>
                    )}
                    {option.usesOAuth && !hasExactTypeConnection && !canReuseGoogleAuth && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        OAuth
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : step === 'choose-google-account' ? (
            <>
              {renderChooseGoogleAccount()}
              <div className="flex justify-start mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setStep('select');
                    setSelectedType(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
              </div>
            </>
          ) : step === 'jira-boards' ? (
            <>
              {renderJiraBoards()}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setStep('configure');
                    setSelectedBoard(null);
                    setJiraBoards([]);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitJiraConnection}
                  disabled={!selectedBoard}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Connection
                </button>
              </div>
            </>
          ) : selectedType === 'jira' ? (
            <>
              {renderConfigForm()}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setStep('select');
                    setSelectedType(null);
                    setConfig({});
                    setJiraTestStatus('idle');
                    setJiraTestError('');
                    setJiraUser(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleTestJiraConnection}
                  disabled={!config.jiraUrl || !config.email || !config.apiToken || jiraTestStatus === 'testing' || loadingBoards}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {(jiraTestStatus === 'testing' || loadingBoards) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {jiraTestStatus === 'testing' ? 'Testing...' : loadingBoards ? 'Loading boards...' : 'Test Connection & Select Board'}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {renderConfigForm()}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setStep('select');
                    setSelectedType(null);
                    setConfig({});
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!connectionName}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Connection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
