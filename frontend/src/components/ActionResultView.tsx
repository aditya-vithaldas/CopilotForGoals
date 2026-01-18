import { useState } from 'react';
import { ArrowLeft, Plus, Loader2, RefreshCw, Check, FileText, List } from 'lucide-react';
import { widgetsApi } from '../services/api';
import ReactMarkdown from 'react-markdown';

interface ActionResultViewProps {
  type: 'summary' | 'key_points';
  title: string;
  content: string;
  fileName: string;
  fileId: string;
  goalId: string;
  onBack: () => void;
  onAddedToDashboard?: () => void;
}

export default function ActionResultView({
  type,
  title,
  content,
  fileName,
  fileId,
  goalId,
  onBack,
  onAddedToDashboard
}: ActionResultViewProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToDashboard = async () => {
    setAdding(true);
    try {
      await widgetsApi.create(goalId, {
        file_id: fileId,
        widget_type: type === 'summary' ? 'summary' : 'key_points',
        title: `${type === 'summary' ? 'Summary' : 'Key Points'}: ${fileName}`,
        content: content,
        config: { fileName }
      });
      setAdded(true);
      onAddedToDashboard?.();
    } catch (error) {
      console.error('Failed to add to dashboard:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {!added ? (
          <button
            onClick={handleAddToDashboard}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {adding ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Add to Dashboard
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <Check size={18} />
            Added to Dashboard
          </div>
        )}
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              type === 'summary' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
            }`}>
              {type === 'summary' ? <FileText size={20} /> : <List size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">Source: {fileName}</p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Hint */}
      {!added && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Add this to your dashboard to see it every time you visit this goal
        </p>
      )}
    </div>
  );
}
