import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  LayoutGrid,
  Target,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronRight,
  Check,
  X,
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

interface RecommendedActionsSidebarProps {
  show?: boolean;
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
      return <Target size={14} className="text-gray-500" />;
  }
};

const getCategoryLabel = (category: ActionCategory) => {
  switch (category) {
    case 'action_item':
      return 'Action Item';
    case 'email_action':
      return 'Email Action';
    case 'playstore_gap':
      return 'Play Store Gap';
    case 'email_to_send':
      return 'Email to Send';
    case 'followup':
      return 'Follow-up';
    default:
      return 'Action';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-l-red-500 bg-red-50/50';
    case 'medium':
      return 'border-l-amber-500 bg-amber-50/50';
    case 'low':
      return 'border-l-gray-300 bg-gray-50/50';
    default:
      return 'border-l-gray-200';
  }
};

export default function RecommendedActionsSidebar({ show = true }: RecommendedActionsSidebarProps) {
  const [actions, setActions] = useState<RecommendedAction[]>(sampleActions);
  const [acceptedActions, setAcceptedActions] = useState<Set<string>>(new Set());
  const [rejectedActions, setRejectedActions] = useState<Set<string>>(new Set());

  if (!show) return null;

  const handleAccept = (actionId: string) => {
    setAcceptedActions(prev => new Set([...prev, actionId]));
    // Remove from rejected if was rejected
    setRejectedActions(prev => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });
  };

  const handleReject = (actionId: string) => {
    setRejectedActions(prev => new Set([...prev, actionId]));
    // Remove from accepted if was accepted
    setAcceptedActions(prev => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });
  };

  const pendingActions = actions.filter(
    a => !acceptedActions.has(a.id) && !rejectedActions.has(a.id)
  );
  const completedCount = acceptedActions.size + rejectedActions.size;

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Recommended Actions</h3>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {pendingActions.length} pending · {completedCount} reviewed
        </p>
      </div>

      {/* Actions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {pendingActions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <CheckCircle size={32} className="mx-auto text-green-400 mb-2" />
            <p className="text-sm text-gray-600">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">You've reviewed all recommendations</p>
          </div>
        ) : (
          pendingActions.map((action) => (
            <div
              key={action.id}
              className={`rounded-lg border-l-4 p-3 transition-all hover:shadow-sm ${getPriorityColor(action.priority)}`}
            >
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {getCategoryIcon(action.category)}
                  <span className="text-xs text-gray-500">{getCategoryLabel(action.category)}</span>
                </div>
                {action.dueDate && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    action.dueDate === 'Today' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {action.dueDate}
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="text-sm font-medium text-gray-900 leading-tight mb-1">
                {action.title}
              </h4>

              {/* Description */}
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                {action.description}
              </p>

              {/* Source Tag */}
              {action.source && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {action.source}
                  </span>
                </div>
              )}

              {/* Accept/Reject Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAccept(action.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-md hover:bg-green-200 transition-colors"
                >
                  <Check size={12} />
                  Accept
                </button>
                <button
                  onClick={() => handleReject(action.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
                >
                  <X size={12} />
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Accepted Actions Summary (collapsed) */}
      {acceptedActions.size > 0 && (
        <div className="border-t border-gray-100 p-2">
          <div className="bg-green-50 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">
                  {acceptedActions.size} action{acceptedActions.size !== 1 ? 's' : ''} accepted
                </span>
              </div>
              <ChevronRight size={14} className="text-green-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
