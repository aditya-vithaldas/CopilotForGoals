import { useState, useEffect } from 'react';
import { LayoutGrid, Calendar, List, Clock, User, Loader2, PlusCircle, Check } from 'lucide-react';
import type { Connection } from '../types';
import { jiraApi, widgetsApi, type JiraIssue, type JiraSprint, type JiraEpic } from '../services/api';

interface JiraViewProps {
  connection: Connection;
  viewType: string;
  onFileImported?: () => void;
  goalId?: string;
  onWidgetAdded?: () => void;
}

const statusCategoryColors: Record<string, string> = {
  'To Do': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Done': 'bg-green-100 text-green-700',
};

const priorityColors: Record<string, string> = {
  'Highest': 'text-red-600',
  'High': 'text-orange-600',
  'Medium': 'text-yellow-600',
  'Low': 'text-gray-500',
  'Lowest': 'text-gray-400',
};

export default function JiraView({ connection, viewType, goalId, onWidgetAdded }: JiraViewProps) {
  const [activeTab, setActiveTab] = useState(viewType);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [sprint, setSprint] = useState<JiraSprint | null>(null);
  const [epics, setEpics] = useState<JiraEpic[]>([]);
  const [recentTickets, setRecentTickets] = useState<JiraIssue[]>([]);
  const [addingWidget, setAddingWidget] = useState<string | null>(null);
  const [addedWidgets, setAddedWidgets] = useState<Set<string>>(new Set());
  const config = connection.config;

  useEffect(() => {
    loadJiraData();
  }, [connection.id]);

  const loadJiraData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all data in parallel
      const [issuesData, sprintData, epicsData, recentData] = await Promise.all([
        jiraApi.getIssues(connection.id),
        jiraApi.getSprint(connection.id),
        jiraApi.getEpics(connection.id),
        jiraApi.getRecentTickets(connection.id),
      ]);

      setIssues(issuesData);
      setSprint(sprintData);
      setEpics(epicsData);
      setRecentTickets(recentData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load Jira data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToDashboard = async (widgetType: 'sprint_stats' | 'kanban_overview' | 'recent_tickets' | 'gantt_chart') => {
    if (!goalId) return;
    setAddingWidget(widgetType);

    try {
      let title = '';
      let content = '';

      const totalIssues = issues.length;
      const doneIssues = issues.filter(i => i.statusCategory === 'Done').length;
      const inProgressIssues = issues.filter(i => i.statusCategory === 'In Progress').length;
      const todoIssues = issues.filter(i => i.statusCategory === 'To Do').length;
      const progress = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

      if (widgetType === 'sprint_stats') {
        title = `Sprint Stats - ${config.boardName || 'Jira'}`;
        content = `## ${sprint?.name || 'Current Sprint'}\n\n`;
        if (sprint?.goal) content += `**Goal:** ${sprint.goal}\n\n`;
        content += `### Progress: ${progress}%\n\n`;
        content += `| Status | Count |\n|--------|-------|\n`;
        content += `| To Do | ${todoIssues} |\n`;
        content += `| In Progress | ${inProgressIssues} |\n`;
        content += `| Done | ${doneIssues} |\n`;
        content += `| **Total** | **${totalIssues}** |\n`;
      } else if (widgetType === 'kanban_overview') {
        title = `Kanban Overview - ${config.boardName || 'Jira'}`;
        content = `## Board Status\n\n`;
        content += `- **To Do:** ${todoIssues} issues\n`;
        content += `- **In Progress:** ${inProgressIssues} issues\n`;
        content += `- **Done:** ${doneIssues} issues\n\n`;
        content += `### Completion: ${progress}%\n`;
      } else if (widgetType === 'recent_tickets') {
        title = `Recent Tickets - ${config.boardName || 'Jira'}`;
        content = `## Latest Activity\n\n`;
        recentTickets.slice(0, 5).forEach(ticket => {
          content += `- **${ticket.key}**: ${ticket.summary} _(${ticket.status})_\n`;
        });
      } else if (widgetType === 'gantt_chart') {
        title = `Gantt Chart - ${config.boardName || 'Jira'}`;
        content = `Project Timeline - ${sprint?.name || 'Current Sprint'}`;

        // Prepare Gantt data from actual Jira issues
        const ganttTasks: Array<{id: string | number; key: string; name: string; type: string; status: string; startDay: number; duration: number}> = [];

        // Add epics
        epics.slice(0, 5).forEach((epic, idx) => {
          ganttTasks.push({
            id: epic.id,
            key: epic.key,
            name: epic.name || epic.summary,
            type: 'epic',
            status: epic.done ? 'done' : 'in_progress',
            startDay: idx * 2, // Spread out epics
            duration: 4 + Math.floor(Math.random() * 3), // Random duration 4-6 days
          });
        });

        // Add issues
        issues.slice(0, 10).forEach((issue, idx) => {
          const status = issue.statusCategory === 'Done' ? 'done' :
                        issue.statusCategory === 'In Progress' ? 'in_progress' : 'todo';
          ganttTasks.push({
            id: issue.id,
            key: issue.key,
            name: issue.summary,
            type: 'story',
            status,
            startDay: idx + 1,
            duration: 2 + Math.floor(Math.random() * 2), // Random duration 2-3 days
          });
        });

        // Store the gantt data in the widget config
        console.log('Creating Gantt widget with tasks:', ganttTasks);
        const result = await widgetsApi.create(goalId, {
          widget_type: widgetType,
          title,
          content,
          config: {
            connectionId: connection.id,
            boardId: config.boardId,
            ganttTasks,
            sprintName: sprint?.name,
            sprintStartDate: sprint?.startDate,
            sprintEndDate: sprint?.endDate,
          }
        });
        console.log('Gantt Widget created:', result);

        setAddedWidgets(prev => new Set([...prev, widgetType]));
        onWidgetAdded?.();
        setAddingWidget(null);
        return;
      }

      console.log('Creating widget with goalId:', goalId);
      const result = await widgetsApi.create(goalId, {
        widget_type: widgetType,
        title,
        content,
        config: { connectionId: connection.id, boardId: config.boardId }
      });
      console.log('Widget created:', result);

      setAddedWidgets(prev => new Set([...prev, widgetType]));
      onWidgetAdded?.();
    } catch (err: any) {
      console.error('Failed to add widget:', err);
      alert(`Failed to add widget: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    } finally {
      setAddingWidget(null);
    }
  };

  const AddToDashboardButton = ({ type, label }: { type: 'sprint_stats' | 'kanban_overview' | 'recent_tickets' | 'gantt_chart'; label: string }) => {
    const isAdding = addingWidget === type;
    const isAdded = addedWidgets.has(type);

    return (
      <button
        onClick={() => {
          if (!goalId) {
            console.error('No goalId provided to JiraView');
            alert('Cannot add to dashboard: goalId is missing');
            return;
          }
          handleAddToDashboard(type);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Loading Jira data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadJiraData}
          className="text-indigo-600 hover:text-indigo-700"
        >
          Try again
        </button>
      </div>
    );
  }

  // Group issues by status category for Kanban
  const groupedByStatus = issues.reduce((acc, issue) => {
    const status = issue.statusCategory || 'To Do';
    if (!acc[status]) acc[status] = [];
    acc[status].push(issue);
    return acc;
  }, {} as Record<string, JiraIssue[]>);

  const renderKanbanBoard = () => {
    const columns = ['To Do', 'In Progress', 'Done'];

    return (
      <div className="grid grid-cols-3 gap-4">
        {columns.map((column) => (
          <div key={column} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center justify-between">
              {column}
              <span className="text-sm text-gray-500">
                {(groupedByStatus[column] || []).length}
              </span>
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {(groupedByStatus[column] || []).map((issue) => (
                <div
                  key={issue.id}
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="text-xs text-gray-500 mb-1">{issue.key}</div>
                  <div className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                    {issue.summary}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${priorityColors[issue.priority || 'Medium']}`}>
                      {issue.priority || 'Medium'}
                    </span>
                    {issue.assignee && (
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600">
                        {issue.assignee.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                  </div>
                  {issue.issueType && (
                    <div className="mt-2 text-xs text-gray-400">{issue.issueType}</div>
                  )}
                </div>
              ))}
              {(groupedByStatus[column] || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No issues</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProjectPlan = () => {
    const totalIssues = issues.length;
    const doneIssues = (groupedByStatus['Done'] || []).length;
    const inProgressIssues = (groupedByStatus['In Progress'] || []).length;
    const progress = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Sprint Info */}
        {sprint && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Active Sprint</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{sprint.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {sprint.state}
                  </span>
                </div>
                {sprint.goal && (
                  <p className="text-sm text-gray-500 mb-2">{sprint.goal}</p>
                )}
                <div className="text-xs text-gray-500">
                  {sprint.startDate && new Date(sprint.startDate).toLocaleDateString()} - {sprint.endDate && new Date(sprint.endDate).toLocaleDateString()}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-blue-600">{progress}%</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
            </div>
          </div>
        )}

        {/* Epics */}
        {epics.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Epics</h3>
            <div className="space-y-3">
              {epics.map((epic) => (
                <div key={epic.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${epic.done ? 'bg-green-500' : 'bg-purple-500'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{epic.name || epic.summary}</div>
                    <div className="text-xs text-gray-500">{epic.key}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    epic.done ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {epic.done ? 'Done' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Total Tickets</div>
            <div className="text-2xl font-semibold text-gray-900">{totalIssues}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">In Progress</div>
            <div className="text-2xl font-semibold text-blue-600">{inProgressIssues}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Completed</div>
            <div className="text-2xl font-semibold text-green-600">{doneIssues}</div>
          </div>
        </div>

        {/* Recent Tickets */}
        {recentTickets.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Tickets</h3>
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-indigo-600 font-medium">{ticket.key}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusCategoryColors[ticket.statusCategory] || 'bg-gray-100 text-gray-700'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="font-medium text-gray-900 truncate">{ticket.summary}</div>
                  </div>
                  <div className="text-sm text-gray-500 flex-shrink-0">
                    {new Date(ticket.created).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSprintView = () => {
    // Show issues that are not done
    const sprintIssues = issues.filter(i => i.statusCategory !== 'Done');

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {sprint && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                <p className="text-sm text-gray-500">
                  {sprint.startDate && new Date(sprint.startDate).toLocaleDateString()} - {sprint.endDate && new Date(sprint.endDate).toLocaleDateString()}
                </p>
                {sprint.goal && (
                  <p className="text-sm text-gray-600 mt-1">{sprint.goal}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Remaining</div>
                <div className="text-lg font-semibold text-blue-600">{sprintIssues.length} issues</div>
              </div>
            </div>
          </div>
        )}
        <div className="divide-y divide-gray-200">
          {sprintIssues.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No active sprint issues
            </div>
          ) : (
            sprintIssues.map((issue) => (
              <div key={issue.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-indigo-600 font-medium">{issue.key}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusCategoryColors[issue.statusCategory] || 'bg-gray-100 text-gray-700'}`}>
                        {issue.status}
                      </span>
                    </div>
                    <div className="font-medium text-gray-900">{issue.summary}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {issue.storyPoints && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {issue.storyPoints}pts
                      </span>
                    )}
                    {issue.assignee && (
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {issue.assignee}
                      </span>
                    )}
                    <span className={priorityColors[issue.priority || 'Medium']}>
                      {issue.priority || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{connection.name}</h2>
          <p className="text-gray-500">
            {config.boardName || 'Board'} &bull; {config.boardType === 'scrum' ? 'Scrum' : 'Kanban'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Add to Dashboard:</span>
          <AddToDashboardButton type="sprint_stats" label="Sprint Stats" />
          <AddToDashboardButton type="kanban_overview" label="Board Overview" />
          <AddToDashboardButton type="recent_tickets" label="Recent Tickets" />
          <AddToDashboardButton type="gantt_chart" label="Gantt Chart" />
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('view_kanban')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'view_kanban'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutGrid className="w-4 h-4 inline mr-2" />
          Kanban Board
        </button>
        <button
          onClick={() => setActiveTab('view_project_plan')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'view_project_plan'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Project Plan
        </button>
        <button
          onClick={() => setActiveTab('view_sprint')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'view_sprint'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <List className="w-4 h-4 inline mr-2" />
          Active Sprint
        </button>
      </div>

      {activeTab === 'view_kanban' && renderKanbanBoard()}
      {activeTab === 'view_project_plan' && renderProjectPlan()}
      {activeTab === 'view_sprint' && renderSprintView()}
    </div>
  );
}
