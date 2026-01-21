import { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Mail,
  LayoutGrid,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronRight,
  Check,
  X,
  Bell,
} from 'lucide-react';

type ActionCategory = 'action_item' | 'email_action' | 'playstore_gap' | 'email_to_send' | 'followup';

interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  category: ActionCategory;
  priority: 'high' | 'medium' | 'low';
  source?: string;
  dueDate?: string;
}

// Sample recommended actions data
const sampleActions: RecommendedAction[] = [
  {
    id: '1',
    title: 'Complete onboarding review document',
    description: 'Review pending in JIRA ticket PROJ-142',
    category: 'action_item',
    priority: 'high',
    source: 'Jira',
    dueDate: 'Today',
  },
  {
    id: '2',
    title: 'Respond to Sarah\'s API integration question',
    description: 'Email received 2 hours ago about authentication flow',
    category: 'email_action',
    priority: 'high',
    source: 'Gmail',
  },
  {
    id: '3',
    title: 'Address tooltip timing feedback',
    description: '15 users mentioned tooltips disappear too quickly',
    category: 'playstore_gap',
    priority: 'medium',
    source: 'Play Store',
  },
  {
    id: '4',
    title: 'Send weekly status update to stakeholders',
    description: 'Due by end of day',
    category: 'email_to_send',
    priority: 'medium',
  },
  {
    id: '5',
    title: 'Follow up with James on deployment timeline',
    description: 'Last contacted 3 days ago about Q1 release',
    category: 'followup',
    priority: 'low',
    source: 'Gmail',
  },
  {
    id: '6',
    title: 'Review Maria\'s pull request',
    description: 'Assigned to you in PROJ-143',
    category: 'action_item',
    priority: 'medium',
    source: 'Jira',
  },
  {
    id: '7',
    title: 'Add skip option to onboarding flow',
    description: '12 users requested ability to skip certain steps',
    category: 'playstore_gap',
    priority: 'high',
    source: 'Play Store',
  },
];

const getCategoryIcon = (category: ActionCategory) => {
  switch (category) {
    case 'action_item':
      return <LayoutGrid size={14} className="text-blue-500" />;
    case 'email_action':
      return <Mail size={14} className="text-red-500" />;
    case 'playstore_gap':
      return <AlertTriangle size={14} className="text-orange-500" />;
    case 'email_to_send':
      return <MessageSquare size={14} className="text-green-500" />;
    case 'followup':
      return <Clock size={14} className="text-purple-500" />;
    default:
      return <Sparkles size={14} className="text-gray-500" />;
  }
};

const getPriorityDot = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
      return 'bg-gray-400';
    default:
      return 'bg-gray-300';
  }
};

export default function RecommendedActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [actions, _setActions] = useState<RecommendedAction[]>(sampleActions);
  const [acceptedActions, setAcceptedActions] = useState<Set<string>>(new Set());
  const [rejectedActions, setRejectedActions] = useState<Set<string>>(new Set());

  const handleAccept = (e: React.MouseEvent, actionId: string) => {
    e.stopPropagation();
    setAcceptedActions(prev => new Set([...prev, actionId]));
    setRejectedActions(prev => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });
  };

  const handleReject = (e: React.MouseEvent, actionId: string) => {
    e.stopPropagation();
    setRejectedActions(prev => new Set([...prev, actionId]));
    setAcceptedActions(prev => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });
  };

  const pendingActions = actions.filter(
    a => !acceptedActions.has(a.id) && !rejectedActions.has(a.id)
  );

  const displayedActions = showAll ? pendingActions : pendingActions.slice(0, 3);
  const hasMore = pendingActions.length > 3;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors shadow-sm"
      >
        <Bell size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Actions</span>
        {pendingActions.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {pendingActions.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowAll(false);
            }}
          />

          {/* Menu Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">Recommended Actions</h3>
                </div>
                <span className="text-xs text-gray-500">
                  {pendingActions.length} pending
                </span>
              </div>
            </div>

            {/* Actions List */}
            <div className="max-h-80 overflow-y-auto">
              {pendingActions.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <CheckCircle size={32} className="mx-auto text-green-400 mb-2" />
                  <p className="text-sm text-gray-600">All caught up!</p>
                  <p className="text-xs text-gray-400 mt-1">You've reviewed all recommendations</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {displayedActions.map((action) => (
                    <div
                      key={action.id}
                      className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Priority Dot & Icon */}
                        <div className="flex-shrink-0 relative">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            {getCategoryIcon(action.category)}
                          </div>
                          <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${getPriorityDot(action.priority)}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {action.title}
                            </h4>
                            {action.dueDate === 'Today' && (
                              <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                Today
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                            {action.description}
                          </p>

                          {/* Actions Row */}
                          <div className="flex items-center gap-2">
                            {action.source && (
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                {action.source}
                              </span>
                            )}
                            <div className="flex-1" />
                            <button
                              onClick={(e) => handleAccept(e, action.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded hover:bg-green-200 transition-colors"
                            >
                              <Check size={12} />
                              Accept
                            </button>
                            <button
                              onClick={(e) => handleReject(e, action.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with View All */}
            {hasMore && !showAll && (
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  View all {pendingActions.length} actions
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Accepted Summary */}
            {acceptedActions.size > 0 && (
              <div className="border-t border-gray-100 px-4 py-2 bg-green-50">
                <div className="flex items-center gap-2 text-xs text-green-700">
                  <CheckCircle size={14} />
                  <span>{acceptedActions.size} action{acceptedActions.size !== 1 ? 's' : ''} accepted</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
