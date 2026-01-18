import { useState, useEffect } from 'react';
import { Search, FileText, FolderOpen, Image, File, Video, Grid, List, Download, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import type { Connection } from '../types';
import { driveApi, type DriveFile } from '../services/api';

interface GoogleDriveViewProps {
  connection: Connection;
  viewType: string;
  onFileImported?: () => void;
}

const mimeTypeIcons: Record<string, typeof FileText> = {
  'application/vnd.google-apps.document': FileText,
  'application/vnd.google-apps.spreadsheet': File,
  'application/vnd.google-apps.presentation': File,
  'application/vnd.google-apps.folder': FolderOpen,
  'image/': Image,
  'video/': Video,
};

const mimeTypeColors: Record<string, string> = {
  'application/vnd.google-apps.document': 'text-blue-500 bg-blue-50',
  'application/vnd.google-apps.spreadsheet': 'text-green-500 bg-green-50',
  'application/vnd.google-apps.presentation': 'text-orange-500 bg-orange-50',
  'application/vnd.google-apps.folder': 'text-yellow-600 bg-yellow-50',
  'image/': 'text-purple-500 bg-purple-50',
  'video/': 'text-red-500 bg-red-50',
  'default': 'text-gray-500 bg-gray-50',
};

function getIconForMimeType(mimeType: string) {
  for (const [key, Icon] of Object.entries(mimeTypeIcons)) {
    if (mimeType.startsWith(key)) {
      return Icon;
    }
  }
  return File;
}

function getColorForMimeType(mimeType: string) {
  for (const [key, color] of Object.entries(mimeTypeColors)) {
    if (mimeType.startsWith(key)) {
      return color;
    }
  }
  return mimeTypeColors.default;
}

function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return '-';
  const size = parseInt(bytes, 10);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export default function GoogleDriveView({ connection, viewType, onFileImported }: GoogleDriveViewProps) {
  const [activeTab, setActiveTab] = useState(viewType);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);
  const config = connection.config;

  useEffect(() => {
    loadFiles();
  }, [connection.id, currentFolderId]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await driveApi.listFiles(connection.id, currentFolderId || config.folderId || undefined);
      setFiles(result.files || []);
    } catch (err: any) {
      console.error('Failed to load files:', err);
      setError(err.response?.data?.error || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await driveApi.searchFiles(connection.id, searchQuery, currentFolderId || config.folderId || undefined);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleImportFile = async (file: DriveFile) => {
    setImporting(file.id);
    try {
      await driveApi.importFile(connection.id, file.id, file.name, file.mimeType);
      onFileImported?.();
      setSelectedFiles(prev => prev.filter(id => id !== file.id));
    } catch (err) {
      console.error('Failed to import file:', err);
    } finally {
      setImporting(null);
    }
  };

  const handleOpenFolder = (folder: DriveFile) => {
    setFolderStack(prev => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  };

  const handleGoBack = () => {
    const newStack = [...folderStack];
    newStack.pop();
    setFolderStack(newStack);
    setCurrentFolderId(newStack.length > 0 ? newStack[newStack.length - 1].id : null);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const renderBreadcrumb = () => {
    if (folderStack.length === 0) return null;
    return (
      <div className="flex items-center gap-2 mb-4 text-sm">
        <button
          onClick={() => { setFolderStack([]); setCurrentFolderId(null); }}
          className="text-indigo-600 hover:underline"
        >
          Root
        </button>
        {folderStack.map((folder, index) => (
          <span key={folder.id} className="flex items-center gap-2">
            <ChevronRight size={14} className="text-gray-400" />
            {index === folderStack.length - 1 ? (
              <span className="text-gray-900">{folder.name}</span>
            ) : (
              <button
                onClick={() => {
                  setFolderStack(folderStack.slice(0, index + 1));
                  setCurrentFolderId(folder.id);
                }}
                className="text-indigo-600 hover:underline"
              >
                {folder.name}
              </button>
            )}
          </span>
        ))}
      </div>
    );
  };

  const renderFileList = (fileList: DriveFile[]) => {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-4 gap-4">
          {fileList.map((file) => {
            const Icon = getIconForMimeType(file.mimeType);
            const isSelected = selectedFiles.includes(file.id);
            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
            return (
              <div
                key={file.id}
                onClick={() => isFolder ? handleOpenFolder(file) : toggleFileSelection(file.id)}
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${getColorForMimeType(file.mimeType)}`}>
                  <Icon size={24} />
                </div>
                <div className="font-medium text-gray-900 text-sm truncate">{file.name}</div>
                <div className="text-xs text-gray-500 mt-1">{formatDate(file.modifiedTime)}</div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fileList.map((file) => {
              const Icon = getIconForMimeType(file.mimeType);
              const isSelected = selectedFiles.includes(file.id);
              const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
              const isImportable = file.mimeType.startsWith('application/vnd.google-apps.document') ||
                                   file.mimeType.startsWith('application/vnd.google-apps.spreadsheet');
              return (
                <tr
                  key={file.id}
                  className={`cursor-pointer ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3">
                    {!isFolder && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFileSelection(file.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={() => isFolder && handleOpenFolder(file)}>
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${getColorForMimeType(file.mimeType)}`}>
                        <Icon size={16} />
                      </div>
                      <span className={`text-sm font-medium ${isFolder ? 'text-indigo-600 hover:underline' : 'text-gray-900'}`}>
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(file.modifiedTime)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{isFolder ? '-' : formatFileSize(file.size)}</td>
                  <td className="px-4 py-3">
                    {isImportable && (
                      <button
                        onClick={() => handleImportFile(file)}
                        disabled={importing === file.id}
                        className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      >
                        {importing === file.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          'Import'
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBrowseFolder = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {folderStack.length > 0 && (
            <button onClick={handleGoBack} className="p-2 hover:bg-gray-100 rounded">
              <ArrowLeft size={18} />
            </button>
          )}
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <List size={18} />
          </button>
        </div>
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{selectedFiles.length} selected</span>
          </div>
        )}
      </div>

      {renderBreadcrumb()}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadFiles}
            className="text-indigo-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No files found in this folder
        </div>
      ) : (
        renderFileList(files)
      )}
    </div>
  );

  const renderSearchFiles = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search files and folders..."
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <>
          <div className="text-sm text-gray-500">
            Found {searchResults.length} results for "{searchQuery}"
          </div>
          {renderFileList(searchResults)}
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{connection.name}</h2>
        <p className="text-gray-500">
          {config.email} {config.folderName && `- ${config.folderName}`}
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('browse_folder')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'browse_folder'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderOpen className="w-4 h-4 inline mr-2" />
          Browse Files
        </button>
        <button
          onClick={() => setActiveTab('search_files')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'search_files'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Search
        </button>
      </div>

      {activeTab === 'browse_folder' && renderBrowseFolder()}
      {activeTab === 'search_files' && renderSearchFiles()}
    </div>
  );
}
