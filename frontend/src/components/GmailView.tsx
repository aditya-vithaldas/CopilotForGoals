import { useState, useEffect } from 'react';
import { Mail, Search, Inbox, Star, Clock, Paperclip, Tag, Loader2, ArrowLeft, RefreshCw, PlusCircle, Check } from 'lucide-react';
import type { Connection } from '../types';
import { gmailApi, widgetsApi, type GmailEmail, type GmailLabel } from '../services/api';

interface GmailViewProps {
  connection: Connection;
  viewType: string;
  onFileImported?: () => void;
  goalId?: string;
  onWidgetAdded?: () => void;
}

const labelColors: Record<string, string> = {
  'INBOX': 'bg-blue-100 text-blue-700',
  'STARRED': 'bg-yellow-100 text-yellow-700',
  'IMPORTANT': 'bg-red-100 text-red-700',
  'SENT': 'bg-green-100 text-green-700',
  'DRAFT': 'bg-gray-100 text-gray-700',
  'UNREAD': 'bg-indigo-100 text-indigo-700',
};

type DashboardWidgetType = 'inbox_summary' | 'unread_count' | 'recent_emails' | 'label_emails';

export default function GmailView({ connection, viewType, goalId, onWidgetAdded }: GmailViewProps) {
  const [activeTab, setActiveTab] = useState(viewType || 'view_inbox');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [addingWidget, setAddingWidget] = useState<string | null>(null);
  const [addedWidgets, setAddedWidgets] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGmailData();
  }, [connection.id]);

  useEffect(() => {
    // Handle initial viewType
    if (viewType) {
      handleViewType(viewType);
    }
  }, [viewType]);

  const handleViewType = (type: string) => {
    setActiveTab(type);
    switch (type) {
      case 'view_inbox':
        loadEmails();
        break;
      case 'view_unread':
        loadEmails('is:unread');
        break;
      case 'view_starred':
        loadEmails('is:starred');
        break;
      case 'view_recent':
        loadEmails('newer_than:7d');
        break;
      case 'view_attachments':
        loadEmails('has:attachment');
        break;
      case 'search_emails':
        setIsSearching(true);
        break;
      default:
        loadEmails();
    }
  };

  const loadGmailData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [emailsData, labelsData] = await Promise.all([
        gmailApi.listEmails(connection.id, undefined, 20),
        gmailApi.getLabels(connection.id),
      ]);

      setEmails(emailsData);
      setLabels(labelsData.filter(l => l.type === 'user' || ['INBOX', 'STARRED', 'IMPORTANT', 'SENT', 'DRAFT'].includes(l.id)));
    } catch (err: any) {
      const errorCode = err.response?.data?.code;
      const errorMessage = err.response?.data?.error || 'Failed to load Gmail data';

      if (errorCode === 'INSUFFICIENT_SCOPES' || errorMessage.includes('insufficient authentication scopes')) {
        setError('Gmail access not authorized. Your Google account was connected before Gmail permissions were added. Please delete this connection and reconnect your Google account to grant Gmail access.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEmails = async (query?: string) => {
    setLoading(true);
    setError(null);
    setActiveFilter(query || '');

    try {
      const data = await gmailApi.listEmails(connection.id, query, 20);
      setEmails(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await gmailApi.searchEmails(connection.id, searchQuery, 20);
      setEmails(data);
      setActiveTab('search_results');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search emails');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (email: GmailEmail) => {
    setLoadingEmail(true);
    try {
      const fullEmail = await gmailApi.getEmail(connection.id, email.id);
      setSelectedEmail(fullEmail);
    } catch (err: any) {
      console.error('Failed to load email:', err);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleAddToDashboard = async (widgetType: DashboardWidgetType, labelName?: string) => {
    if (!goalId) return;
    const widgetKey = labelName ? `${widgetType}_${labelName}` : widgetType;
    setAddingWidget(widgetKey);

    try {
      let title = '';
      let content = '';

      if (widgetType === 'inbox_summary') {
        title = `Gmail Inbox - ${connection.name}`;
        const unreadCount = emails.filter(e => e.labelIds?.includes('UNREAD')).length;
        content = `## Inbox Summary\n\n`;
        content += `- **Total Emails:** ${emails.length}\n`;
        content += `- **Unread:** ${unreadCount}\n\n`;
        content += `### Recent Messages\n\n`;
        emails.slice(0, 5).forEach(email => {
          const from = email.from.split('<')[0].trim();
          content += `- **${from}**: ${email.subject || '(no subject)'}\n`;
        });
      } else if (widgetType === 'unread_count') {
        title = `Unread Emails - ${connection.name}`;
        const unreadCount = emails.filter(e => e.labelIds?.includes('UNREAD')).length;
        content = `## ${unreadCount} Unread Messages\n\n`;
        const unreadEmails = emails.filter(e => e.labelIds?.includes('UNREAD'));
        unreadEmails.slice(0, 5).forEach(email => {
          const from = email.from.split('<')[0].trim();
          content += `- **${from}**: ${email.subject || '(no subject)'}\n`;
        });
      } else if (widgetType === 'recent_emails') {
        title = `Recent Emails - ${connection.name}`;
        content = `## Last 7 Days\n\n`;
        emails.slice(0, 10).forEach(email => {
          const from = email.from.split('<')[0].trim();
          const date = new Date(email.date).toLocaleDateString();
          content += `- **${from}** (${date}): ${email.subject || '(no subject)'}\n`;
        });
      } else if (widgetType === 'label_emails' && labelName) {
        title = `${labelName} - Action Items`;

        // Fetch full content of top 5 emails
        const top5Emails = emails.slice(0, 5);
        const fullEmails = await Promise.all(
          top5Emails.map(email => gmailApi.getEmail(connection.id, email.id))
        );

        // Extract action items from emails
        const actionItemPatterns = [
          /please\s+(?:can you\s+)?([^.!?\n]+[.!?]?)/gi,
          /could you\s+([^.!?\n]+[.!?]?)/gi,
          /need(?:s)?\s+(?:to|you to)\s+([^.!?\n]+[.!?]?)/gi,
          /action\s*(?:item|required)?:?\s*([^.!?\n]+[.!?]?)/gi,
          /todo:?\s*([^.!?\n]+[.!?]?)/gi,
          /deadline:?\s*([^.!?\n]+[.!?]?)/gi,
          /by\s+(?:end of day|eod|monday|tuesday|wednesday|thursday|friday|tomorrow|next week)([^.!?\n]*[.!?]?)/gi,
          /urgent:?\s*([^.!?\n]+[.!?]?)/gi,
          /asap\s*([^.!?\n]+[.!?]?)/gi,
          /follow[- ]?up:?\s*([^.!?\n]+[.!?]?)/gi,
          /reminder:?\s*([^.!?\n]+[.!?]?)/gi,
          /schedule\s+(?:a\s+)?([^.!?\n]+[.!?]?)/gi,
          /send\s+(?:me\s+)?(?:the\s+)?([^.!?\n]+[.!?]?)/gi,
          /review\s+(?:the\s+)?([^.!?\n]+[.!?]?)/gi,
          /confirm\s+([^.!?\n]+[.!?]?)/gi,
        ];

        const actionItems: { from: string; subject: string; action: string; date: string }[] = [];

        fullEmails.forEach(email => {
          const from = email.from.split('<')[0].trim();
          const bodyText = email.textBody || email.htmlBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ') || '';
          const date = new Date(email.date).toLocaleDateString();

          // Extract action items using patterns
          actionItemPatterns.forEach(pattern => {
            const matches = bodyText.matchAll(pattern);
            for (const match of matches) {
              const action = match[0].trim();
              if (action.length > 10 && action.length < 200) {
                actionItems.push({ from, subject: email.subject || 'No subject', action, date });
              }
            }
          });

          // Also check subject for action keywords
          const subjectLower = (email.subject || '').toLowerCase();
          if (subjectLower.includes('action') || subjectLower.includes('urgent') ||
              subjectLower.includes('required') || subjectLower.includes('deadline') ||
              subjectLower.includes('reminder') || subjectLower.includes('follow up')) {
            actionItems.push({
              from,
              subject: email.subject || 'No subject',
              action: `Review: ${email.subject}`,
              date
            });
          }
        });

        // Build the widget content
        content = `## Action Items from "${labelName}"\n\n`;
        content += `*Extracted from ${fullEmails.length} most recent emails*\n\n`;

        if (actionItems.length > 0) {
          // Deduplicate and limit
          const uniqueActions = actionItems
            .filter((item, idx, arr) =>
              arr.findIndex(i => i.action.toLowerCase() === item.action.toLowerCase()) === idx
            )
            .slice(0, 10);

          uniqueActions.forEach((item, idx) => {
            content += `${idx + 1}. **${item.action}**\n`;
            content += `   - *From:* ${item.from} (${item.date})\n`;
            content += `   - *Re:* ${item.subject}\n\n`;
          });

          content += `---\n*${actionItems.length} action items found across ${fullEmails.length} emails*`;
        } else {
          // Fallback: show email subjects as potential items to review
          content += `No explicit action items detected. Recent emails to review:\n\n`;
          fullEmails.forEach((email, idx) => {
            const from = email.from.split('<')[0].trim();
            const date = new Date(email.date).toLocaleDateString();
            content += `${idx + 1}. **${email.subject || 'No subject'}** - ${from} (${date})\n`;
          });
        }
      }

      await widgetsApi.create(goalId, {
        widget_type: widgetType,
        title,
        content,
        config: { connectionId: connection.id, labelName }
      });

      setAddedWidgets(prev => new Set([...prev, widgetKey]));
      onWidgetAdded?.();
    } catch (err) {
      console.error('Failed to add widget:', err);
    } finally {
      setAddingWidget(null);
    }
  };

  const AddToDashboardButton = ({ type, label, labelName }: { type: DashboardWidgetType; label: string; labelName?: string }) => {
    const widgetKey = labelName ? `${type}_${labelName}` : type;
    const isAdding = addingWidget === widgetKey;
    const isAdded = addedWidgets.has(widgetKey);

    return (
      <button
        onClick={() => {
          if (!goalId) {
            console.error('No goalId provided to GmailView');
            alert('Cannot add to dashboard: goalId is missing');
            return;
          }
          handleAddToDashboard(type, labelName);
        }}
        disabled={isAdding || isAdded}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
          isAdded
            ? 'bg-green-100 text-green-700 cursor-default'
            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
        }`}
      >
        {isAdding ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isAdded ? (
          <Check size={14} />
        ) : (
          <PlusCircle size={14} />
        )}
        {isAdded ? 'Added' : label}
      </button>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading && emails.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Loading Gmail...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadGmailData}
          className="text-indigo-600 hover:text-indigo-700"
        >
          Try again
        </button>
      </div>
    );
  }

  // Email detail view
  if (selectedEmail) {
    const hasAttachments = selectedEmail.attachments && selectedEmail.attachments.length > 0;
    const fromName = selectedEmail.from.split('<')[0].trim();
    const fromEmail = selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from;

    return (
      <div>
        <button
          onClick={() => setSelectedEmail(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to inbox
        </button>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-semibold text-sm">
                  {fromName.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {selectedEmail.subject || '(no subject)'}
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800">{fromName}</span>
                  <span className="text-gray-400">&lt;{fromEmail}&gt;</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-sm text-gray-500">
                  {new Date(selectedEmail.date).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(selectedEmail.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* To/Cc */}
            <div className="mt-3 pt-3 border-t border-indigo-100 space-y-1">
              {selectedEmail.to && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 w-8">To:</span>
                  <span className="text-gray-600 truncate">{selectedEmail.to}</span>
                </div>
              )}
              {selectedEmail.cc && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 w-8">Cc:</span>
                  <span className="text-gray-600 truncate">{selectedEmail.cc}</span>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {hasAttachments && (
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Paperclip size={14} />
                  <span>Attachments:</span>
                </div>
                {selectedEmail.attachments!.map((att, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-default"
                  >
                    <Paperclip size={12} className="text-gray-400" />
                    {att.filename}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Email body */}
          <div className="p-6">
            {selectedEmail.htmlBody ? (
              <div
                className="prose prose-sm max-w-none text-gray-700
                  prose-headings:text-gray-900 prose-headings:font-semibold
                  prose-p:text-gray-600 prose-p:leading-relaxed
                  prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-800
                  prose-ul:text-gray-600 prose-ol:text-gray-600
                  prose-blockquote:border-l-indigo-300 prose-blockquote:text-gray-500
                  prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200"
                dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
              />
            ) : selectedEmail.textBody ? (
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                {selectedEmail.textBody}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No content available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{connection.name}</h2>
          <p className="text-gray-500">Gmail Account</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Add to Dashboard:</span>
          <AddToDashboardButton type="inbox_summary" label="Inbox Summary" />
          <AddToDashboardButton type="unread_count" label="Unread Count" />
          <AddToDashboardButton type="recent_emails" label="Recent Emails" />
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-px">
        <button
          onClick={() => { loadEmails(); setActiveTab('view_inbox'); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === 'view_inbox' && !activeFilter
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Inbox className="w-4 h-4 inline mr-2" />
          Inbox
        </button>
        <button
          onClick={() => { loadEmails('is:unread'); setActiveTab('view_unread'); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeFilter === 'is:unread'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Unread
        </button>
        <button
          onClick={() => { loadEmails('is:starred'); setActiveTab('view_starred'); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeFilter === 'is:starred'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Star className="w-4 h-4 inline mr-2" />
          Starred
        </button>
        <button
          onClick={() => { loadEmails('newer_than:7d'); setActiveTab('view_recent'); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeFilter === 'newer_than:7d'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Last 7 Days
        </button>
        <button
          onClick={() => { loadEmails('has:attachment'); setActiveTab('view_attachments'); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeFilter === 'has:attachment'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Paperclip className="w-4 h-4 inline mr-2" />
          With Attachments
        </button>
      </div>

      {/* Labels sidebar + email list */}
      <div className="flex gap-6">
        {/* Labels */}
        <div className="w-56 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Labels</h3>
          <div className="space-y-1">
            {labels.map((label) => {
              const isActive = activeFilter === `label:${label.name}`;
              const widgetKey = `label_emails_${label.name}`;
              const isAddingLabel = addingWidget === widgetKey;
              const isLabelAdded = addedWidgets.has(widgetKey);

              return (
                <div
                  key={label.id}
                  className={`flex items-center gap-1 rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-100' : 'hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => loadEmails(`label:${label.name}`)}
                    className={`flex-1 text-left px-3 py-2 text-sm ${
                      isActive ? 'text-indigo-700' : 'text-gray-600'
                    }`}
                  >
                    <Tag className="w-4 h-4 inline mr-2" />
                    {label.name}
                  </button>
                  {goalId && isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToDashboard('label_emails', label.name);
                      }}
                      disabled={isAddingLabel || isLabelAdded}
                      className={`p-1.5 mr-1 rounded transition-colors ${
                        isLabelAdded
                          ? 'text-green-600'
                          : 'text-indigo-500 hover:bg-indigo-200'
                      }`}
                      title={isLabelAdded ? 'Added to dashboard' : 'Add to dashboard'}
                    >
                      {isAddingLabel ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isLabelAdded ? (
                        <Check size={14} />
                      ) : (
                        <PlusCircle size={14} />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Email list */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-500 text-sm">Loading emails...</span>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No emails found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {emails.map((email, index) => {
                const isUnread = email.labelIds?.includes('UNREAD');
                const isStarred = email.labelIds?.includes('STARRED');
                const fromName = email.from.split('<')[0].trim();

                return (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={`px-4 py-3 cursor-pointer transition-all hover:bg-indigo-50/50 ${
                      isUnread ? 'bg-indigo-50/30' : ''
                    } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUnread ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}>
                        <span className={`text-xs font-semibold ${
                          isUnread ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                          {fromName.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm truncate ${
                            isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          }`}>
                            {fromName}
                          </span>
                          {isStarred && (
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current flex-shrink-0" />
                          )}
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className={`text-sm truncate ${
                          isUnread ? 'font-medium text-gray-800' : 'text-gray-600'
                        }`}>
                          {email.subject || '(no subject)'}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {email.snippet}
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                        {formatDate(email.date)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Refresh button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => loadEmails(activeFilter)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
