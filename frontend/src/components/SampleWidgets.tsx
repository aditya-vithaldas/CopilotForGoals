import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, TrendingUp, Target, MessageSquare, User, Phone, Quote, GripVertical, Check, X, ListTodo, FileText, AlertCircle } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SampleWidgetsProps {
  show?: boolean;
}

// Sortable wrapper for widgets
function SortableWidget({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 p-1.5 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-gray-100 z-10"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      {children}
    </div>
  );
}

// Action Item interface for sample data
interface SampleActionItem {
  id: string;
  action: string;
  from: string;
  date: string;
  status: 'pending' | 'done' | 'deleted';
}

export default function SampleWidgets({ show = true }: SampleWidgetsProps) {
  const [widgetOrder, setWidgetOrder] = useState(['strategyChanges', 'actionItems', 'feedback', 'calls', 'applications']);
  const [feedbackTab, setFeedbackTab] = useState<'today' | 'week' | 'month'>('today');
  const [callsTab, setCallsTab] = useState<'today' | 'week' | 'month'>('today');

  // Sample action items data - focused on OBJECTIVES not tactical items
  const [actionItems, setActionItems] = useState<SampleActionItem[]>([
    { id: '1', action: 'Complete Elasticsearch account authentication', from: 'Elastic Cloud', date: '1/15/2026', status: 'pending' },
    { id: '2', action: 'Pay AWS invoice #INV-2026-0142 by Jan 20', from: 'AWS Billing', date: '1/14/2026', status: 'pending' },
    { id: '3', action: 'Renew Figma team subscription (expires Jan 25)', from: 'Figma', date: '1/13/2026', status: 'done' },
    { id: '4', action: 'Sign vendor agreement with TechPartners Inc', from: 'David Kim', date: '1/12/2026', status: 'pending' },
    { id: '5', action: 'Verify your identity for Stripe account activation', from: 'Stripe', date: '1/11/2026', status: 'pending' },
    { id: '6', action: 'Complete onboarding setup at Notion workspace', from: 'Notion', date: '1/10/2026', status: 'done' },
    { id: '7', action: 'Approval required: Q1 Marketing budget ($45,000)', from: 'Finance Team', date: '1/9/2026', status: 'pending' },
  ]);

  const handleActionStatusChange = (itemId: string, newStatus: 'done' | 'deleted') => {
    setActionItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: newStatus } : item
    ));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (!show) return null;

  // Dummy data for Customer Feedback widget - organized by time period
  const feedbackData = {
    today: {
      totalReviews: 12,
      averageRating: 4.3,
      summary: 'Today\'s feedback is overwhelmingly positive, with users praising the streamlined checkout flow. Minor concerns about mobile responsiveness on older devices.',
      reviews: [
        { user: 'Alex R.', company: 'DesignLab', rating: 5, comment: 'Checkout was seamless! Best experience I\'ve had with any SaaS product.' },
        { user: 'Nina P.', company: 'CloudTech', rating: 4, comment: 'Love the new dashboard layout. Much easier to find what I need now.' },
        { user: 'Tom H.', company: 'StartupHub', rating: 4, comment: 'Great improvements to the notification system. Finally not getting spammed!' },
      ],
    },
    week: {
      totalReviews: 89,
      averageRating: 4.1,
      summary: 'This week saw strong adoption of new features with 89 reviews. Users love the updated UI but request better documentation for advanced settings.',
      reviews: [
        { user: 'Sarah M.', company: 'TechCorp', rating: 5, comment: 'The new onboarding flow made it so easy to get our team started. Love the step-by-step approach!' },
        { user: 'James K.', company: 'StartupXYZ', rating: 4, comment: 'Good overall, but the role assignment step was a bit confusing for our admin.' },
        { user: 'Maria L.', company: 'FinanceHub', rating: 3, comment: 'Onboarding took longer than expected. Could use a quick-start option for experienced users.' },
      ],
    },
    month: {
      totalReviews: 342,
      averageRating: 4.0,
      summary: 'Monthly trends show consistent satisfaction with core features. Top requests include bulk actions, better export options, and improved mobile experience.',
      reviews: [
        { user: 'Chris D.', company: 'MediaFlow', rating: 5, comment: 'Been using this for a month now and it\'s transformed our workflow. Highly recommend!' },
        { user: 'Emma W.', company: 'DataDriven', rating: 4, comment: 'Solid product with regular updates. Would love to see API rate limits increased.' },
        { user: 'Ryan M.', company: 'GrowthCo', rating: 3, comment: 'Good value for the price, but the learning curve is steep for new team members.' },
      ],
    },
  };

  // Dummy data for Customer Service Calls - organized by time period
  const callsData = {
    today: {
      totalCalls: 48,
      analyzedCalls: 42,
      summary: 'Today\'s calls show excellent resolution rates with 85% first-call resolution. Main topics: billing inquiries and feature questions.',
      sentiment: { positive: 72, neutral: 20, negative: 8 },
      customerLoved: [
        { theme: 'Quick Resolution Time', count: 12, quotes: ['"The agent solved my issue in under 3 minutes - impressive!"', '"I expected to wait on hold forever but got help right away"'] },
        { theme: 'Knowledgeable Support Staff', count: 9, quotes: ['"Your rep knew exactly what I needed without me explaining twice"', '"Finally someone who understands the technical side!"'] },
        { theme: 'Friendly & Patient Service', count: 7, quotes: ['"The agent was so patient with my questions - didn\'t rush me at all"', '"Made me feel valued as a customer, not just another ticket"'] },
      ],
      customerHated: [
        { theme: 'Long Hold Times', count: 3, quotes: ['"Waited 15 minutes just to get transferred again"', '"The hold music is driving me crazy after 20 minutes"'] },
        { theme: 'Repeated Information Requests', count: 2, quotes: ['"Had to explain my issue 3 times to different people"', '"Why do I need to give my account number every transfer?"'] },
        { theme: 'Unresolved Issues', count: 1, quotes: ['"Still waiting for a callback that was promised 2 days ago"', '"The issue wasn\'t fixed and no one followed up"'] },
      ],
    },
    week: {
      totalCalls: 342,
      analyzedCalls: 289,
      summary: 'This week saw 342 calls with strong positive sentiment. Top performers resolved 95% of issues. Training opportunity identified for billing questions.',
      sentiment: { positive: 68, neutral: 22, negative: 10 },
      customerLoved: [
        { theme: 'Quick Resolution Time', count: 87, quotes: ['"The agent solved my issue in under 3 minutes - impressive!"', '"I expected to wait on hold forever but got help right away"'] },
        { theme: 'Knowledgeable Support Staff', count: 64, quotes: ['"Your rep knew exactly what I needed without me explaining twice"', '"Finally someone who understands the technical side!"'] },
        { theme: 'Friendly & Patient Service', count: 52, quotes: ['"The agent was so patient with my questions - didn\'t rush me at all"', '"Made me feel valued as a customer, not just another ticket"'] },
      ],
      customerHated: [
        { theme: 'Long Hold Times', count: 23, quotes: ['"Waited 15 minutes just to get transferred again"', '"The hold music is driving me crazy after 20 minutes"'] },
        { theme: 'Repeated Information Requests', count: 18, quotes: ['"Had to explain my issue 3 times to different people"', '"Why do I need to give my account number every transfer?"'] },
        { theme: 'Unresolved Issues', count: 11, quotes: ['"Still waiting for a callback that was promised 2 days ago"', '"The issue wasn\'t fixed and no one followed up"'] },
      ],
    },
    month: {
      totalCalls: 1247,
      analyzedCalls: 1089,
      summary: 'Monthly analysis shows 15% improvement in customer satisfaction. Peak call times shifted to mornings. Recurring themes: onboarding help and integrations.',
      sentiment: { positive: 65, neutral: 24, negative: 11 },
      customerLoved: [
        { theme: 'Quick Resolution Time', count: 298, quotes: ['"The agent solved my issue in under 3 minutes - impressive!"', '"I expected to wait on hold forever but got help right away"'] },
        { theme: 'Knowledgeable Support Staff', count: 234, quotes: ['"Your rep knew exactly what I needed without me explaining twice"', '"Finally someone who understands the technical side!"'] },
        { theme: 'Friendly & Patient Service', count: 187, quotes: ['"The agent was so patient with my questions - didn\'t rush me at all"', '"Made me feel valued as a customer, not just another ticket"'] },
      ],
      customerHated: [
        { theme: 'Long Hold Times', count: 78, quotes: ['"Waited 15 minutes just to get transferred again"', '"The hold music is driving me crazy after 20 minutes"'] },
        { theme: 'Repeated Information Requests', count: 56, quotes: ['"Had to explain my issue 3 times to different people"', '"Why do I need to give my account number every transfer?"'] },
        { theme: 'Unresolved Issues', count: 34, quotes: ['"Still waiting for a callback that was promised 2 days ago"', '"The issue wasn\'t fixed and no one followed up"'] },
      ],
    },
  };

  // Dummy data for applications graph
  const applicationsData = [
    { day: 'Mon', count: 45, date: 'Jan 12' },
    { day: 'Tue', count: 62, date: 'Jan 13' },
    { day: 'Wed', count: 38, date: 'Jan 14' },
    { day: 'Thu', count: 71, date: 'Jan 15' },
    { day: 'Fri', count: 55, date: 'Jan 16' },
    { day: 'Sat', count: 28, date: 'Jan 17' },
    { day: 'Sun', count: 33, date: 'Jan 18' },
  ];
  const targetLine = 50;
  const maxValue = Math.max(...applicationsData.map(d => d.count), targetLine);

  // Widget content renderers
  const renderActionItemsWidget = () => {
    const visibleItems = actionItems.filter(item => item.status !== 'deleted');
    const completedCount = visibleItems.filter(i => i.status === 'done').length;

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <ListTodo size={16} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Action Items</h3>
            <p className="text-xs text-gray-500">{completedCount} of {visibleItems.length} completed</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-10">Status</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Action Item</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">From</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    item.status === 'done' ? 'bg-green-50/50' : ''
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      item.status === 'done'
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-gray-300'
                    }`}>
                      {item.status === 'done' && <Check size={12} />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.action}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">({item.date})</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 truncate max-w-[120px]" title={item.from}>
                    {item.from}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {item.status !== 'done' && (
                        <button
                          onClick={() => handleActionStatusChange(item.id, 'done')}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Mark as done"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleActionStatusChange(item.id, 'deleted')}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFeedbackWidget = () => {
    const currentData = feedbackData[feedbackTab];
    const tabLabels = { today: 'Today', week: 'This Week', month: 'This Month' };

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={16} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Customer Feedback</h3>
            <p className="text-xs text-gray-500">{currentData.totalReviews} reviews</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['today', 'week', 'month'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFeedbackTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                feedbackTab === tab
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Stats row */}
          <div className="flex items-center gap-6 mb-4 pb-4 border-b border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{currentData.totalReviews}</div>
              <div className="text-xs text-gray-500">Reviews</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-yellow-500">{currentData.averageRating}</span>
                <Star size={18} className="text-yellow-500 fill-current" />
              </div>
              <div className="text-xs text-gray-500">Avg Rating</div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">{currentData.summary}</p>
          </div>

          {/* Recent Reviews */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User size={14} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Recent Reviews</span>
              </div>
            </div>
            <div className="space-y-2">
              {currentData.reviews.map((feedback, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900">{feedback.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{feedback.company}</span>
                    <div className="flex ml-auto">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">"{feedback.comment}"</p>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium">
              See more reviews →
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCallsWidget = () => {
    const currentData = callsData[callsTab];
    const tabLabels = { today: 'Today', week: 'This Week', month: 'This Month' };

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
            <Phone size={16} className="text-teal-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Customer Service Calls Analysis</h3>
            <p className="text-xs text-gray-500">{currentData.analyzedCalls} calls analyzed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['today', 'week', 'month'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCallsTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                callsTab === tab
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">{currentData.summary}</p>
          </div>

          {/* Sentiment bar */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full" style={{ width: `${currentData.sentiment.positive}%` }} />
                  <div className="bg-gray-400 h-full" style={{ width: `${currentData.sentiment.neutral}%` }} />
                  <div className="bg-red-500 h-full" style={{ width: `${currentData.sentiment.negative}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">{currentData.sentiment.positive}% Positive</span>
                <span className="text-gray-500">{currentData.sentiment.neutral}% Neutral</span>
                <span className="text-red-500">{currentData.sentiment.negative}% Negative</span>
              </div>
            </div>
          </div>

          {/* What customers loved */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp size={14} className="text-green-600" />
              <span className="text-sm font-medium text-gray-700">What customers loved</span>
            </div>
            <div className="space-y-3">
              {currentData.customerLoved.map((item, index) => (
                <div key={index} className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">{item.theme}</span>
                    <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-medium">{item.count} mentions</span>
                  </div>
                  <div className="space-y-1.5">
                    {item.quotes.map((quote, qIndex) => (
                      <div key={qIndex} className="flex items-start gap-2 text-xs text-green-700">
                        <Quote size={10} className="mt-0.5 flex-shrink-0 opacity-60" />
                        <span className="italic">{quote}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What customers complained about */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown size={14} className="text-red-500" />
              <span className="text-sm font-medium text-gray-700">What customers complained about</span>
            </div>
            <div className="space-y-3">
              {currentData.customerHated.map((item, index) => (
                <div key={index} className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-800">{item.theme}</span>
                    <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full font-medium">{item.count} issues</span>
                  </div>
                  <div className="space-y-1.5">
                    {item.quotes.map((quote, qIndex) => (
                      <div key={qIndex} className="flex items-start gap-2 text-xs text-red-700">
                        <Quote size={10} className="mt-0.5 flex-shrink-0 opacity-60" />
                        <span className="italic">{quote}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full py-2 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors font-medium">
              See more calls →
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderApplicationsWidget = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={16} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">New Product Applications</h3>
          <p className="text-xs text-gray-500">Last 7 days</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <div>
            <div className="text-2xl font-bold text-gray-900">{applicationsData.reduce((sum, d) => sum + d.count, 0)}</div>
            <div className="text-xs text-gray-500">Total Applications</div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target size={14} className="text-orange-500" />
            <span className="text-gray-600">Target: <span className="font-medium">{targetLine}/day</span></span>
          </div>
        </div>
        <div className="relative h-48">
          <div className="absolute left-0 top-0 h-32 w-8 flex flex-col justify-between text-xs text-gray-400">
            <span>{maxValue}</span>
            <span>{Math.round(maxValue / 2)}</span>
            <span>0</span>
          </div>
          <div className="ml-10 relative">
            <div className="relative h-32">
              <div className="absolute left-0 right-0 border-t-2 border-dashed border-orange-400 z-10" style={{ bottom: `${(targetLine / maxValue) * 100}%` }}>
                <span className="absolute -right-1 -top-4 text-xs text-orange-500 bg-white px-1">Target</span>
              </div>
              <div className="flex items-end justify-between h-full gap-2 px-2">
                {applicationsData.map((data, index) => {
                  const heightPercent = (data.count / maxValue) * 100;
                  const isAboveTarget = data.count >= targetLine;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div
                        className={`w-full rounded-t transition-all ${isAboveTarget ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                        title={`${data.date}: ${data.count} applications`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between px-2 mt-2">
              {applicationsData.map((data, index) => (
                <div key={index} className="flex-1 text-center text-xs text-gray-500">{data.day}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-green-500" />
            Above target
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-blue-500" />
            Below target
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-6 border-t-2 border-dashed border-orange-400" />
            Target line
          </div>
        </div>
      </div>
    </div>
  );

  const renderStrategyChangesWidget = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <FileText size={16} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-sm">Changes to Product Strategy Document</h3>
          <p className="text-xs text-gray-500">Updated 2 hours ago</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full">
          <AlertCircle size={12} className="text-amber-600" />
          <span className="text-xs font-medium text-amber-700">New</span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Changes</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-amber-600">1</span>
            </div>
            <div>
              <p className="text-sm text-gray-800">Reduce focus on new user acquisition</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-amber-600">2</span>
            </div>
            <div>
              <p className="text-sm text-gray-800">Partner NPS to shift towards retention goals with specific targets on churn <span className="font-semibold text-amber-700">(5% max)</span></p>
            </div>
          </div>
        </div>
        {/* Impact Callout */}
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Potential Impact to Your Roadmap</p>
              <p className="text-xs text-red-600 mt-1">
                <span className="font-semibold">Referral Program V2</span> — scheduled for Q2 may need to be deprioritized given reduced acquisition focus
              </p>
            </div>
          </div>
        </div>

        <button className="mt-4 w-full py-2 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-medium border border-amber-200">
          View full document →
        </button>
      </div>
    </div>
  );

  const widgetRenderers: Record<string, () => React.ReactNode> = {
    strategyChanges: renderStrategyChangesWidget,
    actionItems: renderActionItemsWidget,
    feedback: renderFeedbackWidget,
    calls: renderCallsWidget,
    applications: renderApplicationsWidget,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <p className="text-xs text-gray-400">Drag widgets to reorder</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {widgetOrder.map((widgetId) => (
              <SortableWidget key={widgetId} id={widgetId}>
                {widgetRenderers[widgetId]?.()}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
