import { BookOpen, LayoutGrid, CheckCircle, FileText, TrendingUp } from 'lucide-react';

interface ActivityStatusBannerProps {
  show?: boolean;
}

export default function ActivityStatusBanner({ show = true }: ActivityStatusBannerProps) {
  if (!show) return null;

  // Sample activity data - in a real app this would come from props or API
  const wikiActivity = {
    pagesAdded: 23,
    recentPages: ['Product Roadmap Q1', 'API Documentation', 'Design Guidelines'],
    folder: 'wiki folder',
  };

  const jiraActivity = {
    newTickets: 3,
    completedTickets: 1,
    recentTicketKeys: ['PROJ-142', 'PROJ-143', 'PROJ-144'],
  };

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 rounded-xl border border-indigo-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Recent Activity</h3>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Wiki Activity */}
          <div className="flex items-start gap-3 bg-white/70 rounded-lg px-4 py-3 flex-1 min-w-[280px]">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-indigo-600">{wikiActivity.pagesAdded}</span>
                <span className="text-sm text-gray-700">pages added to the {wikiActivity.folder}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                including{' '}
                {wikiActivity.recentPages.map((page, i) => (
                  <span key={page}>
                    <span className="font-medium text-gray-700">{page}</span>
                    {i < wikiActivity.recentPages.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Jira Activity */}
          <div className="flex items-start gap-3 bg-white/70 rounded-lg px-4 py-3 flex-1 min-w-[280px]">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <LayoutGrid size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-500" />
                  <span className="text-lg font-bold text-blue-600">{jiraActivity.newTickets}</span>
                  <span className="text-sm text-gray-700">new Jira tickets added</span>
                </div>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-lg font-bold text-green-600">{jiraActivity.completedTickets}</span>
                  <span className="text-sm text-gray-700">completed</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Recent:{' '}
                {jiraActivity.recentTicketKeys.map((key, i) => (
                  <span key={key}>
                    <span className="font-medium text-blue-600">{key}</span>
                    {i < jiraActivity.recentTicketKeys.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
