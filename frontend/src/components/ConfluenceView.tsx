import { useState } from 'react';
import { Search, FileText, Clock, User, ChevronRight, FolderOpen } from 'lucide-react';
import type { Connection } from '../types';

interface ConfluenceViewProps {
  connection: Connection;
  viewType: string;
}

// Mock data for demonstration
const mockPages = [
  {
    id: '1',
    title: 'Project Overview',
    lastModified: '2024-01-15',
    author: 'John Doe',
    excerpt: 'This document provides an overview of the project goals, timeline, and key stakeholders...',
    labels: ['overview', 'project'],
  },
  {
    id: '2',
    title: 'API Documentation',
    lastModified: '2024-01-14',
    author: 'Jane Smith',
    excerpt: 'Complete API reference including endpoints, authentication, and examples...',
    labels: ['api', 'technical'],
  },
  {
    id: '3',
    title: 'Onboarding Guide',
    lastModified: '2024-01-12',
    author: 'Bob Wilson',
    excerpt: 'Step-by-step guide for new team members to get started with the project...',
    labels: ['onboarding', 'guide'],
  },
  {
    id: '4',
    title: 'Architecture Decision Records',
    lastModified: '2024-01-10',
    author: 'Alice Brown',
    excerpt: 'Collection of architecture decisions made during the project lifecycle...',
    labels: ['architecture', 'technical'],
  },
  {
    id: '5',
    title: 'Release Notes v2.0',
    lastModified: '2024-01-08',
    author: 'Charlie Davis',
    excerpt: 'Summary of changes, new features, and bug fixes in version 2.0...',
    labels: ['release', 'changelog'],
  },
];

const mockRecentUpdates = [
  { page: 'API Documentation', action: 'Updated', user: 'Jane Smith', time: '2 hours ago' },
  { page: 'Project Overview', action: 'Commented', user: 'John Doe', time: '5 hours ago' },
  { page: 'Release Notes v2.0', action: 'Created', user: 'Charlie Davis', time: '1 day ago' },
  { page: 'Architecture Decision Records', action: 'Updated', user: 'Alice Brown', time: '2 days ago' },
];

const mockPageTree = [
  {
    title: 'Getting Started',
    children: ['Installation', 'Configuration', 'First Steps'],
  },
  {
    title: 'Development',
    children: ['API Reference', 'SDK Guide', 'Best Practices'],
  },
  {
    title: 'Operations',
    children: ['Deployment', 'Monitoring', 'Troubleshooting'],
  },
];

export default function ConfluenceView({ connection, viewType }: ConfluenceViewProps) {
  const [activeTab, setActiveTab] = useState(viewType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<typeof mockPages[0] | null>(null);
  const config = connection.config;

  const filteredPages = mockPages.filter(
    (page) =>
      !searchQuery ||
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.labels.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderBrowseWiki = () => (
    <div className="grid grid-cols-3 gap-6">
      {/* Page Tree */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Page Tree</h3>
        <div className="space-y-2">
          {mockPageTree.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <FolderOpen size={16} className="text-gray-400" />
                <span className="font-medium text-gray-900">{section.title}</span>
              </div>
              <div className="ml-6 space-y-1">
                {section.children.map((child) => (
                  <div
                    key={child}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <FileText size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{child}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pages List */}
      <div className="col-span-2 space-y-4">
        {mockPages.map((page) => (
          <div
            key={page.id}
            onClick={() => setSelectedPage(page)}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  {page.title}
                </h4>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{page.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {page.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {page.lastModified}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
            {page.labels.length > 0 && (
              <div className="flex gap-2 mt-3">
                {page.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Page Preview Modal */}
      {selectedPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{selectedPage.title}</h3>
              <button
                onClick={() => setSelectedPage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>By {selectedPage.author}</span>
                <span>Last modified: {selectedPage.lastModified}</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <p>{selectedPage.excerpt}</p>
                <p className="text-gray-400 italic mt-4">
                  (Full page content would be loaded from Confluence API)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSearchWiki = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search documentation..."
            autoFocus
          />
        </div>
      </div>

      {searchQuery && (
        <div className="text-sm text-gray-500 mb-2">
          Found {filteredPages.length} results for "{searchQuery}"
        </div>
      )}

      <div className="space-y-4">
        {filteredPages.map((page) => (
          <div
            key={page.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 cursor-pointer transition-colors"
          >
            <h4 className="font-medium text-indigo-600 mb-1">{page.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{page.excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{page.author}</span>
              <span>{page.lastModified}</span>
              {page.labels.map((label) => (
                <span key={label} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecentUpdates = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mockRecentUpdates.map((update, i) => (
            <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm text-indigo-600">
                  {update.user.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{update.user}</span>
                    <span className="text-gray-500"> {update.action.toLowerCase()} </span>
                    <span className="font-medium text-indigo-600">{update.page}</span>
                  </div>
                  <div className="text-xs text-gray-400">{update.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Pages</div>
          <div className="text-2xl font-semibold text-gray-900">{mockPages.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Contributors</div>
          <div className="text-2xl font-semibold text-gray-900">5</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Updates This Week</div>
          <div className="text-2xl font-semibold text-gray-900">12</div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{connection.name}</h2>
        <p className="text-gray-500">Space: {config.spaceName || config.spaceKey}</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('browse_wiki')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'browse_wiki'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderOpen className="w-4 h-4 inline mr-2" />
          Browse Pages
        </button>
        <button
          onClick={() => setActiveTab('search_wiki')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'search_wiki'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Search
        </button>
        <button
          onClick={() => setActiveTab('recent_updates')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'recent_updates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Recent Updates
        </button>
      </div>

      {activeTab === 'browse_wiki' && renderBrowseWiki()}
      {activeTab === 'search_wiki' && renderSearchWiki()}
      {activeTab === 'recent_updates' && renderRecentUpdates()}
    </div>
  );
}
