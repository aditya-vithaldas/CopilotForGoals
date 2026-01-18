import { Star, ThumbsUp, ThumbsDown, TrendingUp, Target, MessageSquare, User, Phone, Quote } from 'lucide-react';

interface SampleWidgetsProps {
  show?: boolean;
}

export default function SampleWidgets({ show = true }: SampleWidgetsProps) {
  if (!show) return null;

  // Dummy data for Customer Feedback widget - Onboarding Module focused
  const reviewStats = {
    totalReviews: 156,
    averageRating: 4.1,
    period: 'Last 7 days',
  };

  const userLikes = [
    'Onboarding wizard is intuitive and easy to follow',
    'Progress tracker helps me know where I am in the process',
    'Quick setup - was up and running in under 5 minutes',
  ];

  const userDislikes = [
    'Would like option to skip certain onboarding steps',
    'Some tooltips disappear too quickly before I can read them',
    'Need better explanation of advanced settings during setup',
  ];

  const sampleFeedback = [
    { user: 'Sarah M.', company: 'TechCorp', rating: 5, comment: 'The new onboarding flow made it so easy to get our team started. Love the step-by-step approach!' },
    { user: 'James K.', company: 'StartupXYZ', rating: 4, comment: 'Good overall, but the role assignment step was a bit confusing for our admin.' },
    { user: 'Maria L.', company: 'FinanceHub', rating: 3, comment: 'Onboarding took longer than expected. Could use a quick-start option for experienced users.' },
  ];

  // Dummy data for Customer Service Calls Feedback
  const csCallsStats = {
    totalCalls: 342,
    analyzedCalls: 289,
    period: 'Last 7 days',
    sentiment: { positive: 68, neutral: 22, negative: 10 },
  };

  const customerLoved = [
    {
      theme: 'Quick Resolution Time',
      count: 87,
      quotes: [
        '"The agent solved my issue in under 3 minutes - impressive!"',
        '"I expected to wait on hold forever but got help right away"',
      ],
    },
    {
      theme: 'Knowledgeable Support Staff',
      count: 64,
      quotes: [
        '"Your rep knew exactly what I needed without me explaining twice"',
        '"Finally someone who understands the technical side!"',
      ],
    },
    {
      theme: 'Friendly & Patient Service',
      count: 52,
      quotes: [
        '"The agent was so patient with my questions - didn\'t rush me at all"',
        '"Made me feel valued as a customer, not just another ticket"',
      ],
    },
  ];

  const customerHated = [
    {
      theme: 'Long Hold Times',
      count: 23,
      quotes: [
        '"Waited 15 minutes just to get transferred again"',
        '"The hold music is driving me crazy after 20 minutes"',
      ],
    },
    {
      theme: 'Repeated Information Requests',
      count: 18,
      quotes: [
        '"Had to explain my issue 3 times to different people"',
        '"Why do I need to give my account number every transfer?"',
      ],
    },
    {
      theme: 'Unresolved Issues',
      count: 11,
      quotes: [
        '"Still waiting for a callback that was promised 2 days ago"',
        '"The issue wasn\'t fixed and no one followed up"',
      ],
    },
  ];

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

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-semibold text-gray-900">Sample Widgets</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Feedback Widget - Onboarding Module */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={16} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm">Customer Feedback: Onboarding Module</h3>
              <p className="text-xs text-gray-500">{reviewStats.period}</p>
            </div>
          </div>
          <div className="p-4">
            {/* Stats Row */}
            <div className="flex items-center gap-6 mb-4 pb-4 border-b border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{reviewStats.totalReviews}</div>
                <div className="text-xs text-gray-500">Total Responses</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold text-yellow-500">{reviewStats.averageRating}</span>
                  <Star size={18} className="text-yellow-500 fill-current" />
                </div>
                <div className="text-xs text-gray-500">Avg Rating</div>
              </div>
            </div>

            {/* What Customers Liked */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp size={14} className="text-green-600" />
                <span className="text-sm font-medium text-gray-700">What customers liked</span>
              </div>
              <ul className="space-y-1.5">
                {userLikes.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What Customers Want Improved */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsDown size={14} className="text-orange-500" />
                <span className="text-sm font-medium text-gray-700">Areas to improve</span>
              </div>
              <ul className="space-y-1.5">
                {userDislikes.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sample Customer Feedback */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Recent feedback samples</span>
              </div>
              <div className="space-y-2">
                {sampleFeedback.map((feedback, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-900">{feedback.user}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{feedback.company}</span>
                      <div className="flex ml-auto">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 italic">"{feedback.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Service Calls Feedback Widget */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-teal-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm">Customer Service Calls Analysis</h3>
              <p className="text-xs text-gray-500">{csCallsStats.period} - {csCallsStats.analyzedCalls} calls analyzed</p>
            </div>
          </div>
          <div className="p-4">
            {/* Sentiment Overview */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${csCallsStats.sentiment.positive}%` }}
                    />
                    <div
                      className="bg-gray-400 h-full"
                      style={{ width: `${csCallsStats.sentiment.neutral}%` }}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${csCallsStats.sentiment.negative}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">{csCallsStats.sentiment.positive}% Positive</span>
                  <span className="text-gray-500">{csCallsStats.sentiment.neutral}% Neutral</span>
                  <span className="text-red-500">{csCallsStats.sentiment.negative}% Negative</span>
                </div>
              </div>
            </div>

            {/* What Customers Loved */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <ThumbsUp size={14} className="text-green-600" />
                <span className="text-sm font-medium text-gray-700">What customers loved</span>
              </div>
              <div className="space-y-3">
                {customerLoved.map((item, index) => (
                  <div key={index} className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">{item.theme}</span>
                      <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-medium">
                        {item.count} mentions
                      </span>
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

            {/* What Customers Hated */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ThumbsDown size={14} className="text-red-500" />
                <span className="text-sm font-medium text-gray-700">What customers complained about</span>
              </div>
              <div className="space-y-3">
                {customerHated.map((item, index) => (
                  <div key={index} className="bg-red-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-800">{item.theme}</span>
                      <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full font-medium">
                        {item.count} issues
                      </span>
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
            </div>
          </div>
        </div>

        {/* Applications Data Graph Widget */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
            {/* Summary Stats */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {applicationsData.reduce((sum, d) => sum + d.count, 0)}
                </div>
                <div className="text-xs text-gray-500">Total Applications</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target size={14} className="text-orange-500" />
                <span className="text-gray-600">Target: <span className="font-medium">{targetLine}/day</span></span>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-48">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-32 w-8 flex flex-col justify-between text-xs text-gray-400">
                <span>{maxValue}</span>
                <span>{Math.round(maxValue / 2)}</span>
                <span>0</span>
              </div>

              {/* Chart */}
              <div className="ml-10 relative">
                {/* Chart area with bars */}
                <div className="relative h-32">
                  {/* Target line - positioned within the chart area */}
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-orange-400 z-10"
                    style={{ bottom: `${(targetLine / maxValue) * 100}%` }}
                  >
                    <span className="absolute -right-1 -top-4 text-xs text-orange-500 bg-white px-1">Target</span>
                  </div>

                  {/* Bars */}
                  <div className="flex items-end justify-between h-full gap-2 px-2">
                    {applicationsData.map((data, index) => {
                      const heightPercent = (data.count / maxValue) * 100;
                      const isAboveTarget = data.count >= targetLine;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center h-full justify-end">
                          <div
                            className={`w-full rounded-t transition-all ${
                              isAboveTarget ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                            title={`${data.date}: ${data.count} applications`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between px-2 mt-2">
                  {applicationsData.map((data, index) => (
                    <div key={index} className="flex-1 text-center text-xs text-gray-500">
                      {data.day}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
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
      </div>
    </div>
  );
}
