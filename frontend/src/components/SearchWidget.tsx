import { useState } from 'react';
import { Search, X, Loader2, FileText, Mail, LayoutGrid, FolderOpen, BookOpen, Plus, Check } from 'lucide-react';
import { driveApi, gmailApi, jiraApi, widgetsApi, type DriveFile, type GmailEmail, type JiraIssue } from '../services/api';
import type { Connection } from '../types';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'drive' | 'gmail' | 'jira' | 'confluence';
  source: string;
  icon: React.ReactNode;
  url?: string;
}

interface SearchWidgetProps {
  goalId: string;
  connections: Connection[];
  onWidgetAdded?: () => void;
}

export default function SearchWidget({ goalId, connections, onWidgetAdded }: SearchWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingToDashboard, setAddingToDashboard] = useState(false);
  const [addedToDashboard, setAddedToDashboard] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setAddedToDashboard(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    setHasSearched(true);
    const allResults: SearchResult[] = [];

    try {
      // Search in Google Drive connections
      const driveConnections = connections.filter(c => c.type === 'google_drive' || c.type === 'google_docs');
      for (const conn of driveConnections) {
        try {
          const files = await driveApi.searchFiles(conn.id, query);
          files.slice(0, 3).forEach((file: DriveFile) => {
            allResults.push({
              id: `drive-${file.id}`,
              title: file.name,
              description: `Modified: ${file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown'}`,
              type: 'drive',
              source: conn.name,
              icon: <FolderOpen size={16} className="text-green-600" />,
              url: file.webViewLink,
            });
          });
        } catch (e) {
          console.error('Drive search failed:', e);
        }
      }

      // Search in Gmail connections
      const gmailConnections = connections.filter(c => c.type === 'gmail');
      for (const conn of gmailConnections) {
        try {
          const emails = await gmailApi.searchEmails(conn.id, query, 3);
          emails.forEach((email: GmailEmail) => {
            allResults.push({
              id: `gmail-${email.id}`,
              title: email.subject || '(No subject)',
              description: `From: ${email.from} - ${email.snippet?.substring(0, 60)}...`,
              type: 'gmail',
              source: conn.name,
              icon: <Mail size={16} className="text-red-600" />,
            });
          });
        } catch (e) {
          console.error('Gmail search failed:', e);
        }
      }

      // Search in Jira connections
      const jiraConnections = connections.filter(c => c.type === 'jira');
      for (const conn of jiraConnections) {
        try {
          const issues = await jiraApi.getIssues(conn.id);
          // Filter issues that match the query in summary or key
          const matchingIssues = issues.filter((issue: JiraIssue) =>
            issue.summary.toLowerCase().includes(query.toLowerCase()) ||
            issue.key.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 3);

          matchingIssues.forEach((issue: JiraIssue) => {
            allResults.push({
              id: `jira-${issue.id}`,
              title: `${issue.key}: ${issue.summary}`,
              description: `Status: ${issue.status} | ${issue.issueType || 'Issue'}`,
              type: 'jira',
              source: conn.name,
              icon: <LayoutGrid size={16} className="text-blue-600" />,
            });
          });
        } catch (e) {
          console.error('Jira search failed:', e);
        }
      }

      // Limit to top 4 results total
      setResults(allResults.slice(0, 4));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddToDashboard = async () => {
    if (results.length === 0) return;

    setAddingToDashboard(true);
    try {
      const content = results.map(r => `- **${r.title}**\n  ${r.description} _(${r.source})_`).join('\n\n');

      await widgetsApi.create(goalId, {
        widget_type: 'search_results',
        title: `Search: "${query}"`,
        content,
        config: {
          query,
          results: results.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            type: r.type,
            source: r.source,
          })),
        },
      });

      setAddedToDashboard(true);
      onWidgetAdded?.();
    } catch (error) {
      console.error('Failed to add widget:', error);
    } finally {
      setAddingToDashboard(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drive': return <FolderOpen size={16} className="text-green-600" />;
      case 'gmail': return <Mail size={16} className="text-red-600" />;
      case 'jira': return <LayoutGrid size={16} className="text-blue-600" />;
      case 'confluence': return <BookOpen size={16} className="text-indigo-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors shadow-sm"
      >
        <Search size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Quick Search</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl mx-4 overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Search size={20} className="text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search across all your connected sources..."
                  className="flex-1 text-lg outline-none placeholder-gray-400"
                  autoFocus
                />
                {searching ? (
                  <Loader2 size={20} className="text-indigo-600 animate-spin" />
                ) : query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Button */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {connections.length} source{connections.length !== 1 ? 's' : ''} connected
              </span>
              <button
                onClick={handleSearch}
                disabled={!query.trim() || searching}
                className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {!hasSearched ? (
                <div className="p-8 text-center text-gray-500">
                  <Search size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Enter a keyword and press Enter or click Search</p>
                </div>
              ) : searching ? (
                <div className="p-8 text-center">
                  <Loader2 size={32} className="mx-auto mb-3 text-indigo-600 animate-spin" />
                  <p className="text-sm text-gray-500">Searching across your sources...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No results found for "{query}"</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="p-2">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => result.url && window.open(result.url, '_blank')}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {result.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {result.description}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                            {result.source}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Add to Dashboard */}
            {results.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </span>
                <button
                  onClick={handleAddToDashboard}
                  disabled={addingToDashboard || addedToDashboard}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    addedToDashboard
                      ? 'bg-green-100 text-green-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                  }`}
                >
                  {addedToDashboard ? (
                    <>
                      <Check size={14} />
                      Added to Dashboard
                    </>
                  ) : addingToDashboard ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Add to Dashboard
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
