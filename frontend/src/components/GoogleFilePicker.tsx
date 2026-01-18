import { useState, useEffect } from 'react';
import { X, FolderOpen, FileText, File, ChevronRight, Check, Loader2, ArrowLeft } from 'lucide-react';
import type { Connection } from '../types';
import { driveApi, type DriveFile } from '../services/api';

interface GoogleFilePickerProps {
  connection: Connection;
  mode: 'folder' | 'files';
  onSelect: (selection: { folderId?: string; folderName?: string; files?: DriveFile[] }) => void;
  onCancel: () => void;
}

function getIconForMimeType(mimeType: string) {
  if (mimeType === 'application/vnd.google-apps.folder') return FolderOpen;
  if (mimeType.includes('document')) return FileText;
  return File;
}

export default function GoogleFilePicker({ connection, mode, onSelect, onCancel }: GoogleFilePickerProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadFiles();
  }, [currentFolderId]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await driveApi.listFiles(connection.id, currentFolderId || undefined);
      setFiles(result.files || []);
    } catch (err: any) {
      console.error('Failed to load files:', err);
      setError(err.response?.data?.error || 'Failed to load files');
    } finally {
      setLoading(false);
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

  const handleSelectFolder = (folder: DriveFile) => {
    if (selectedFolder?.id === folder.id) {
      setSelectedFolder(null);
    } else {
      setSelectedFolder({ id: folder.id, name: folder.name });
    }
  };

  const handleToggleFile = (file: DriveFile) => {
    const isSelected = selectedFiles.some(f => f.id === file.id);
    if (isSelected) {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles(prev => [...prev, file]);
    }
  };

  const handleConfirm = () => {
    if (mode === 'folder') {
      if (selectedFolder) {
        onSelect({ folderId: selectedFolder.id, folderName: selectedFolder.name });
      } else if (currentFolderId && folderStack.length > 0) {
        // Use current folder if none explicitly selected
        const current = folderStack[folderStack.length - 1];
        onSelect({ folderId: current.id, folderName: current.name });
      } else {
        // Root folder
        onSelect({ folderId: 'root', folderName: 'My Drive' });
      }
    } else {
      onSelect({ files: selectedFiles });
    }
  };

  const handleSelectCurrentFolder = () => {
    if (folderStack.length > 0) {
      const current = folderStack[folderStack.length - 1];
      onSelect({ folderId: current.id, folderName: current.name });
    } else {
      onSelect({ folderId: 'root', folderName: 'My Drive' });
    }
  };

  const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
  const documents = files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'folder' ? 'Select a Folder' : 'Select Files'}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === 'folder'
                ? 'Choose a folder to connect to this goal'
                : 'Select the documents you want to import'}
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-sm">
          {folderStack.length > 0 && (
            <button onClick={handleGoBack} className="p-1 hover:bg-gray-200 rounded">
              <ArrowLeft size={16} />
            </button>
          )}
          <button
            onClick={() => { setFolderStack([]); setCurrentFolderId(null); }}
            className="text-indigo-600 hover:underline"
          >
            My Drive
          </button>
          {folderStack.map((folder, index) => (
            <span key={folder.id} className="flex items-center gap-2">
              <ChevronRight size={14} className="text-gray-400" />
              {index === folderStack.length - 1 ? (
                <span className="text-gray-900 font-medium">{folder.name}</span>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={loadFiles} className="text-indigo-600 hover:underline">
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Folders */}
              {folders.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Folders</h3>
                  <div className="space-y-1">
                    {folders.map((folder) => {
                      const isSelected = mode === 'folder' && selectedFolder?.id === folder.id;
                      return (
                        <div
                          key={folder.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-100 border-2 border-indigo-500' : 'hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          {mode === 'folder' && (
                            <button
                              onClick={() => handleSelectFolder(folder)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check size={14} className="text-white" />}
                            </button>
                          )}
                          <FolderOpen size={20} className="text-yellow-500 flex-shrink-0" />
                          <span
                            className="flex-1 text-gray-900 truncate cursor-pointer hover:text-indigo-600"
                            onClick={() => handleOpenFolder(folder)}
                          >
                            {folder.name}
                          </span>
                          <button
                            onClick={() => handleOpenFolder(folder)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Files (only shown in files mode) */}
              {mode === 'files' && documents.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Documents</h3>
                  <div className="space-y-1">
                    {documents.map((file) => {
                      const Icon = getIconForMimeType(file.mimeType);
                      const isSelected = selectedFiles.some(f => f.id === file.id);
                      const isImportable = file.mimeType.includes('document') || file.mimeType.includes('spreadsheet');

                      if (!isImportable) return null;

                      return (
                        <div
                          key={file.id}
                          onClick={() => handleToggleFile(file)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-100 border-2 border-indigo-500' : 'hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <Icon size={20} className="text-blue-500 flex-shrink-0" />
                          <span className="flex-1 text-gray-900 truncate">{file.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {folders.length === 0 && (mode === 'folder' || documents.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  {mode === 'folder' ? 'No folders in this location' : 'No importable documents in this location'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {mode === 'folder' ? (
                selectedFolder ? (
                  <span>Selected: <strong>{selectedFolder.name}</strong></span>
                ) : (
                  <span>Current: <strong>{folderStack.length > 0 ? folderStack[folderStack.length - 1].name : 'My Drive'}</strong></span>
                )
              ) : (
                <span>{selectedFiles.length} file(s) selected</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {mode === 'folder' && !selectedFolder && (
                <button
                  onClick={handleSelectCurrentFolder}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Use Current Folder
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={mode === 'files' && selectedFiles.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mode === 'folder' ? 'Select Folder' : 'Import Selected'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
