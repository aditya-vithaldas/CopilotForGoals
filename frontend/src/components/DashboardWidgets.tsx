import { useState } from 'react';
import { RefreshCw, Trash2, FileText, List, Loader2, ChevronDown, ChevronUp, LayoutGrid, Calendar, Clock, GanttChart, Search, GripVertical, Mail } from 'lucide-react';
import { widgetsApi, type Widget } from '../services/api';
import ReactMarkdown from 'react-markdown';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sample Gantt chart data - fallback if no data in widget config
const sampleGanttTasks = [
  { id: '1', key: 'SAMPLE-1', name: 'User Authentication', type: 'epic', status: 'done', startDay: 0, duration: 5 },
  { id: '2', key: 'SAMPLE-2', name: 'Login Flow', type: 'story', status: 'done', startDay: 0, duration: 3 },
  { id: '3', key: 'SAMPLE-3', name: 'Dashboard Design', type: 'epic', status: 'in_progress', startDay: 3, duration: 7 },
  { id: '4', key: 'SAMPLE-4', name: 'Widget Components', type: 'story', status: 'in_progress', startDay: 3, duration: 4 },
  { id: '5', key: 'SAMPLE-5', name: 'API Integration', type: 'epic', status: 'todo', startDay: 8, duration: 6 },
];

interface GanttTask {
  id: string;
  key?: string;
  name: string;
  type: string;
  status: string;
  startDay: number;
  duration: number;
}

interface GanttChartViewProps {
  tasks?: GanttTask[];
  sprintName?: string;
}

const GanttChartView = ({ tasks, sprintName }: GanttChartViewProps) => {
  const ganttTasks = tasks && tasks.length > 0 ? tasks : sampleGanttTasks;
  const totalDays = 14;
  const dayWidth = 40;
  const rowHeight = 32;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Sprint header */}
      {sprintName && (
        <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100 text-sm font-medium text-indigo-700">
          {sprintName}
        </div>
      )}

      {/* Header with days */}
      <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="w-48 flex-shrink-0 px-3 py-2 font-medium text-xs text-gray-600 border-r border-gray-200">
          Task
        </div>
        <div className="flex">
          {Array.from({ length: totalDays }).map((_, i) => (
            <div
              key={i}
              className="text-center text-xs text-gray-500 border-r border-gray-100"
              style={{ width: dayWidth }}
            >
              <div className="py-1 font-medium">Day {i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Task rows */}
      {ganttTasks.map((task) => (
        <div key={task.id} className="flex border-b border-gray-100 hover:bg-gray-50">
          {/* Task name */}
          <div
            className={`w-48 flex-shrink-0 px-3 py-2 border-r border-gray-200 flex items-center gap-2 ${
              task.type === 'epic' ? 'font-medium bg-gray-50' : 'pl-5 text-sm'
            }`}
            style={{ height: rowHeight }}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(task.status)}`} />
            <span className="truncate text-gray-700" title={task.name}>
              {task.key && <span className="text-xs text-gray-400 mr-1">{task.key}</span>}
              {task.name.length > 20 ? task.name.substring(0, 20) + '...' : task.name}
            </span>
          </div>

          {/* Timeline bar */}
          <div className="relative flex-1" style={{ height: rowHeight }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: totalDays }).map((_, i) => (
                <div
                  key={i}
                  className="border-r border-gray-100"
                  style={{ width: dayWidth }}
                />
              ))}
            </div>

            {/* Task bar */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 rounded-md flex items-center justify-center text-xs text-white font-medium shadow-sm ${getStatusColor(task.status)}`}
              style={{
                left: task.startDay * dayWidth + 4,
                width: Math.max(task.duration * dayWidth - 8, 24),
                height: task.type === 'epic' ? 20 : 16,
              }}
              title={`${task.name} (${task.status})`}
            >
              {task.duration > 2 && (
                <span className="truncate px-1">
                  {task.status === 'done' ? '✓' : task.status === 'in_progress' ? '→' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-3 mt-2 border-t border-gray-100 px-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-green-500" />
          Done
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-blue-500" />
          In Progress
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-gray-400" />
          To Do
        </div>
      </div>
    </div>
  );
};

// Sortable Widget Item Component
interface SortableWidgetProps {
  widget: Widget;
  isExpanded: boolean;
  refreshing: string | null;
  onRefresh: (widget: Widget) => void;
  onDelete: (widget: Widget) => void;
  onToggleExpand: (widgetId: string) => void;
}

function SortableWidget({ widget, isExpanded, refreshing, onRefresh, onDelete, onToggleExpand }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  // Determine icon and color based on widget type
  const getIconAndColor = () => {
    switch (widget.widget_type) {
      case 'summary':
        return { Icon: FileText, iconColor: 'bg-blue-100 text-blue-600' };
      case 'key_points':
        return { Icon: List, iconColor: 'bg-purple-100 text-purple-600' };
      case 'sprint_stats':
        return { Icon: Calendar, iconColor: 'bg-green-100 text-green-600' };
      case 'kanban_overview':
        return { Icon: LayoutGrid, iconColor: 'bg-indigo-100 text-indigo-600' };
      case 'recent_tickets':
        return { Icon: Clock, iconColor: 'bg-orange-100 text-orange-600' };
      case 'gantt_chart':
        return { Icon: GanttChart, iconColor: 'bg-teal-100 text-teal-600' };
      case 'search_results':
        return { Icon: Search, iconColor: 'bg-amber-100 text-amber-600' };
      case 'label_emails':
      case 'inbox_summary':
      case 'unread_count':
      case 'recent_emails':
        return { Icon: Mail, iconColor: 'bg-red-100 text-red-600' };
      default:
        return { Icon: FileText, iconColor: 'bg-gray-100 text-gray-600' };
    }
  };
  const { Icon, iconColor } = getIconAndColor();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
        isDragging ? 'shadow-lg ring-2 ring-indigo-300' : 'shadow-sm'
      }`}
    >
      {/* Widget Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
            <Icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 text-sm truncate">{widget.title}</h3>
            <p className="text-xs text-gray-500">
              Updated {new Date(widget.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onRefresh(widget)}
            disabled={refreshing === widget.id}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Refresh"
          >
            {refreshing === widget.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
          <button
            onClick={() => onDelete(widget)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Remove"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => onToggleExpand(widget.id)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Widget Content */}
      {isExpanded && (
        <div className={`p-4 ${widget.widget_type === 'gantt_chart' ? 'max-h-96' : 'max-h-64'} overflow-y-auto`}>
          {widget.widget_type === 'gantt_chart' ? (
            <GanttChartView
              tasks={widget.config?.ganttTasks}
              sprintName={widget.config?.sprintName}
            />
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{widget.content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface DashboardWidgetsProps {
  widgets: Widget[];
  onRefresh: () => void;
}

export default function DashboardWidgets({ widgets, onRefresh }: DashboardWidgetsProps) {
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [orderedWidgets, setOrderedWidgets] = useState<Widget[]>(widgets);

  // Update ordered widgets when props change
  if (widgets.length !== orderedWidgets.length ||
      widgets.some((w, i) => !orderedWidgets.find(ow => ow.id === w.id))) {
    setOrderedWidgets(widgets);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedWidgets.findIndex((w) => w.id === active.id);
      const newIndex = orderedWidgets.findIndex((w) => w.id === over.id);

      const newOrder = arrayMove(orderedWidgets, oldIndex, newIndex);
      setOrderedWidgets(newOrder);

      // Save the new order to backend
      try {
        await widgetsApi.reorder(newOrder.map((w, idx) => ({ id: w.id, position: idx })));
      } catch (error) {
        console.error('Failed to save widget order:', error);
        // Revert on error
        setOrderedWidgets(orderedWidgets);
      }
    }
  };

  const handleRefresh = async (widget: Widget) => {
    setRefreshing(widget.id);
    try {
      await widgetsApi.refresh(widget.id);
      onRefresh();
    } catch (error) {
      console.error('Failed to refresh widget:', error);
    } finally {
      setRefreshing(null);
    }
  };

  const handleDelete = async (widget: Widget) => {
    if (!confirm('Remove this widget from your dashboard?')) return;
    try {
      await widgetsApi.delete(widget.id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete widget:', error);
    }
  };

  const toggleExpanded = (widgetId: string) => {
    setExpanded(prev => ({ ...prev, [widgetId]: !prev[widgetId] }));
  };

  if (widgets.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <p className="text-xs text-gray-400">Drag widgets to reorder</p>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {orderedWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                isExpanded={expanded[widget.id] !== false}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                onDelete={handleDelete}
                onToggleExpand={toggleExpanded}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
