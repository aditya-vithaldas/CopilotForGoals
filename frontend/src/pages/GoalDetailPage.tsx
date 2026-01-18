import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  FileText,
  FolderOpen,
  Database,
  BookOpen,
  LayoutGrid,
  Trash2,
  Sparkles,
  Play,
  ChevronDown,
  Loader2,
  Mail,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { goalsApi, connectionsApi, filesApi, driveApi, chatApi, widgetsApi, type DriveFile, type Widget } from '../services/api';
import type { Goal, Connection, ConnectionType, Suggestion } from '../types';
import AddConnectionModal from '../components/AddConnectionModal';
import JiraView from '../components/JiraView';
import DatabaseView from '../components/DatabaseView';
import ConfluenceView from '../components/ConfluenceView';
import GoogleDriveView from '../components/GoogleDriveView';
import GmailView from '../components/GmailView';
import GoogleFilePicker from '../components/GoogleFilePicker';
import ChatButton from '../components/ChatButton';
import ActionResultView from '../components/ActionResultView';
import DashboardWidgets from '../components/DashboardWidgets';
import SampleWidgets from '../components/SampleWidgets';
import ActivityStatusBanner from '../components/ActivityStatusBanner';
import SearchWidget from '../components/SearchWidget';
import RecommendedActionsMenu from '../components/RecommendedActionsMenu';

const connectionIcons: Record<ConnectionType, React.ReactNode> = {
  google_docs: <FileText className="w-4 h-4" />,
  google_drive: <FolderOpen className="w-4 h-4" />,
  gmail: <Mail className="w-4 h-4" />,
  jira: <LayoutGrid className="w-4 h-4" />,
  mysql: <Database className="w-4 h-4" />,
  confluence: <BookOpen className="w-4 h-4" />,
};

const connectionLabels: Record<ConnectionType, string> = {
  google_docs: 'Google Docs',
  google_drive: 'Google Drive',
  gmail: 'Gmail',
  jira: 'Jira',
  mysql: 'MySQL Database',
  confluence: 'Confluence Wiki',
};

type ActionResult = {
  type: 'summary' | 'key_points';
  title: string;
  content: string;
  fileName: string;
  fileId: string;
};

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [activeView, setActiveView] = useState<{ type: string; connection: Connection } | null>(null);
  const [showSourcesDropdown, setShowSourcesDropdown] = useState(false);
  const [pickerConnection, setPickerConnection] = useState<Connection | null>(null);
  const [pickerMode, setPickerMode] = useState<'folder' | 'files'>('folder');
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadGoal();
      loadWidgets();
    }
  }, [id]);

  // Check for OAuth callback
  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected && goal?.connections) {
      // Find the newly added connection (most recent Google connection without folder set)
      const newConnection = goal.connections.find(
        c => (c.type === 'google_drive' || c.type === 'google_docs') && !c.config.folderId
      );
      if (newConnection) {
        setPickerConnection(newConnection);
        setPickerMode(newConnection.type === 'google_drive' ? 'folder' : 'files');
        // Clear URL params
        setSearchParams({});
      }
    }
  }, [goal, searchParams]);

  const loadGoal = async () => {
    try {
      const data = await goalsApi.getById(id!);
      setGoal(data);
      setSuggestions(data.suggestions || []);

      // Auto-generate suggestions if there are connections but no suggestions
      if (data.connections && data.connections.length > 0 && (!data.suggestions || data.suggestions.length === 0)) {
        const newSuggestions = await goalsApi.generateSuggestions(id!);
        setSuggestions(newSuggestions);
      }
    } catch (error) {
      console.error('Failed to load goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWidgets = async () => {
    try {
      const data = await widgetsApi.getForGoal(id!);
      setWidgets(data);
    } catch (error) {
      console.error('Failed to load widgets:', error);
    }
  };

  const handleAddConnection = async (type: ConnectionType, name: string, config: Record<string, unknown>) => {
    try {
      await connectionsApi.create(id!, type, name, config);
      await loadGoal();
      setShowAddConnection(false);
      handleGenerateSuggestions();
    } catch (error) {
      console.error('Failed to add connection:', error);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    try {
      await connectionsApi.delete(connectionId);
      await loadGoal();
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const handleGenerateSuggestions = async () => {
    setGeneratingSuggestions(true);
    try {
      const newSuggestions = await goalsApi.generateSuggestions(id!);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handlePickerSelect = async (selection: { folderId?: string; folderName?: string; files?: DriveFile[] }) => {
    if (!pickerConnection) return;

    try {
      if (selection.folderId && selection.folderName) {
        // Update connection with selected folder
        await driveApi.setFolder(pickerConnection.id, selection.folderId, selection.folderName);
      }

      if (selection.files && selection.files.length > 0) {
        // Import selected files
        for (const file of selection.files) {
          await driveApi.importFile(pickerConnection.id, file.id, file.name, file.mimeType);
        }
      }

      setPickerConnection(null);
      await loadGoal();
      handleGenerateSuggestions();
    } catch (error) {
      console.error('Failed to save selection:', error);
    }
  };

  const handleStartEditing = () => {
    setEditName(goal?.name || '');
    setEditDescription(goal?.description || '');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditName('');
    setEditDescription('');
  };

  const handleSaveGoal = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      const updated = await goalsApi.update(id!, editName.trim(), editDescription.trim());
      setGoal({ ...goal!, name: updated.name, description: updated.description });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuggestionAction = async (suggestion: Suggestion) => {
    const connection = goal?.connections?.find(c => c.id === suggestion.connection_id);
    const file = goal?.files?.find(f => f.id === suggestion.file_id);

    // Handle file-based actions (summarize, extract_points)
    if (suggestion.action_type === 'summarize' && suggestion.file_id) {
      setProcessingAction(suggestion.id);
      try {
        const result = await chatApi.summarize(suggestion.file_id);
        setActionResult({
          type: 'summary',
          title: 'Document Summary',
          content: result.summary,
          fileName: result.file.name,
          fileId: result.file.id,
        });
      } catch (error: any) {
        console.error('Failed to summarize:', error);
        alert(error.response?.data?.error || 'Failed to generate summary');
      } finally {
        setProcessingAction(null);
      }
      return;
    }

    if (suggestion.action_type === 'extract_points' && suggestion.file_id) {
      setProcessingAction(suggestion.id);
      try {
        const result = await chatApi.extractPoints(suggestion.file_id);
        setActionResult({
          type: 'key_points',
          title: 'Key Points',
          content: result.points,
          fileName: result.file.name,
          fileId: result.file.id,
        });
      } catch (error: any) {
        console.error('Failed to extract points:', error);
        alert(error.response?.data?.error || 'Failed to extract key points');
      } finally {
        setProcessingAction(null);
      }
      return;
    }

    // Handle connection-based actions (browse, search, views)
    if (connection) {
      setActiveView({ type: suggestion.action_type, connection });
    }
  };

  const hasConnections = goal?.connections && goal.connections.length > 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Goal not found</h2>
          <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:text-indigo-700">
            Go back to goals
          </button>
        </div>
      </div>
    );
  }

  // Render action result view (summary, key points)
  if (actionResult) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActionResultView
          type={actionResult.type}
          title={actionResult.title}
          content={actionResult.content}
          fileName={actionResult.fileName}
          fileId={actionResult.fileId}
          goalId={id!}
          onBack={() => setActionResult(null)}
          onAddedToDashboard={loadWidgets}
        />
        {goal && <ChatButton goal={goal} />}
      </div>
    );
  }

  // Render active view if one is selected
  if (activeView) {
    const ViewComponent = (() => {
      switch (activeView.connection.type) {
        case 'jira': return JiraView;
        case 'mysql': return DatabaseView;
        case 'confluence': return ConfluenceView;
        case 'google_drive':
        case 'google_docs': return GoogleDriveView;
        case 'gmail': return GmailView;
        default: return null;
      }
    })();

    if (ViewComponent) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setActiveView(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} />
            Back to {goal.name}
          </button>
          <ViewComponent
            connection={activeView.connection}
            viewType={activeView.type}
            onFileImported={loadGoal}
            goalId={id}
            onWidgetAdded={loadWidgets}
          />
          {goal && <ChatButton goal={goal} />}
        </div>
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Sources */}
        <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            All Goals
          </button>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Goal name"
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-600 w-full max-w-lg"
                  autoFocus
                />
              </div>
              <div>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a description (optional)"
                  rows={2}
                  className="text-gray-500 bg-transparent border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 w-full max-w-lg resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveGoal}
                  disabled={!editName.trim() || isSaving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Save
                </button>
                <button
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="group">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{goal.name}</h1>
                <button
                  onClick={handleStartEditing}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit goal"
                >
                  <Pencil size={16} />
                </button>
              </div>
              {goal.description && (
                <p className="mt-1 text-gray-500">{goal.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Sources Dropdown, Actions, and Search (shown when connections exist) */}
        {hasConnections && (
          <div className="flex items-center gap-3">
            {/* Search Widget */}
            <SearchWidget
              goalId={id!}
              connections={goal.connections || []}
              onWidgetAdded={loadWidgets}
            />

            {/* Recommended Actions Menu */}
            <RecommendedActionsMenu />

            {/* Sources Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSourcesDropdown(!showSourcesDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex -space-x-2">
                  {goal.connections!.slice(0, 3).map((conn) => (
                    <div
                      key={conn.id}
                      className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center"
                    >
                      {connectionIcons[conn.type]}
                    </div>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {goal.connections!.length} Source{goal.connections!.length !== 1 ? 's' : ''}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

            {showSourcesDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSourcesDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-20">
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Connected Sources</span>
                      <button
                        onClick={() => {
                          setShowSourcesDropdown(false);
                          setShowAddConnection(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {goal.connections!.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            conn.status === 'connected' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {connectionIcons[conn.type]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                              {conn.name}
                            </div>
                            <div className="text-xs text-gray-500">{connectionLabels[conn.type]}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteConnection(conn.id)}
                          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {!hasConnections ? (
        /* Empty State - No Connections */
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect your data sources</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Connect to Google Drive, Jira, databases, or Confluence to start working with your data.
          </p>
          <button
            onClick={() => setShowAddConnection(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Add Your First Source
          </button>
        </div>
      ) : (
        /* Actions & Widgets View */
        <div className="space-y-6">
          {/* Activity Status Banner */}
          <ActivityStatusBanner />

          {/* Dashboard Widgets */}
          {widgets.length > 0 && (
            <DashboardWidgets widgets={widgets} onRefresh={loadWidgets} />
          )}

          {/* Sample Widgets - Showcase */}
          <SampleWidgets />

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                What would you like to do?
              </h2>
              {suggestions.length > 0 && (
                <button
                  onClick={handleGenerateSuggestions}
                  disabled={generatingSuggestions}
                  className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  {generatingSuggestions ? 'Refreshing...' : 'Refresh suggestions'}
                </button>
              )}
            </div>

            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  Generating suggestions based on your connected sources...
                </p>
                <button
                  onClick={handleGenerateSuggestions}
                  disabled={generatingSuggestions}
                  className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  {generatingSuggestions ? 'Generating...' : 'Generate Now'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group suggestions by connection */}
                {(() => {
                  // Group suggestions by connection_id
                  const grouped = suggestions.reduce((acc, suggestion) => {
                    const connId = suggestion.connection_id || 'files';
                    if (!acc[connId]) acc[connId] = [];
                    acc[connId].push(suggestion);
                    return acc;
                  }, {} as Record<string, typeof suggestions>);

                  return Object.entries(grouped).map(([connId, connSuggestions]) => {
                    const connection = goal.connections?.find(c => c.id === connId);
                    const sourceType = connection?.type || 'files';
                    const sourceName = connection?.name || 'Imported Files';

                    return (
                      <div key={connId} className="space-y-3">
                        {/* Source Header */}
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            sourceType === 'jira' ? 'bg-blue-100 text-blue-600' :
                            sourceType === 'gmail' ? 'bg-red-100 text-red-600' :
                            sourceType === 'google_drive' ? 'bg-green-100 text-green-600' :
                            sourceType === 'google_docs' ? 'bg-blue-100 text-blue-600' :
                            sourceType === 'mysql' ? 'bg-orange-100 text-orange-600' :
                            sourceType === 'confluence' ? 'bg-indigo-100 text-indigo-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {connectionIcons[sourceType as ConnectionType] || <FileText className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{connectionLabels[sourceType as ConnectionType] || 'Files'}</h3>
                            <p className="text-sm text-gray-500">{sourceName}</p>
                          </div>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {connSuggestions.map((suggestion) => {
                            const isProcessing = processingAction === suggestion.id;
                            return (
                              <button
                                key={suggestion.id}
                                onClick={() => handleSuggestionAction(suggestion)}
                                disabled={isProcessing}
                                className="text-left p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group disabled:opacity-70"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                    {isProcessing ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Play size={16} />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                                      {suggestion.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{suggestion.description}</p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Files Section */}
          {goal.files && goal.files.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Imported Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {goal.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-900 truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={() => filesApi.delete(file.id).then(loadGoal)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Connection Modal */}
      {showAddConnection && (
        <AddConnectionModal
          goalId={id!}
          existingConnections={goal.connections}
          onClose={() => setShowAddConnection(false)}
          onAdd={handleAddConnection}
          onUseExisting={(connection, mode) => {
            setPickerConnection(connection);
            setPickerMode(mode);
            setShowAddConnection(false);
          }}
        />
      )}

      {/* Google File Picker */}
      {pickerConnection && (
        <GoogleFilePicker
          connection={pickerConnection}
          mode={pickerMode}
          onSelect={handlePickerSelect}
          onCancel={() => setPickerConnection(null)}
        />
      )}

      {/* Chat Button */}
      {goal && <ChatButton goal={goal} />}
    </div>
  );
}
