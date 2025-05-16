import { useState, useEffect, useCallback } from 'react';
import { getFiles } from '../utils/api';

export function FileList({ onFileSelect, selectedFiles, refreshTrigger }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
  
    // Move loadFiles into useCallback to prevent unnecessary recreations
    const loadFiles = useCallback(async (isRefresh = false) => {
        setLoading(true);
        try {
          const response = await getFiles(isRefresh ? 0 : page * 10);
          
          // Deduplicate files based on file_id
          const newFiles = response.results;
          if (isRefresh) {
            // For refresh, just use the new files after deduplication
            const uniqueFiles = Array.from(new Map(newFiles.map(file => [file.file_id, file])).values());
            setFiles(uniqueFiles);
          } else {
            // For pagination, combine with existing files and deduplicate
            const combinedFiles = [...files, ...newFiles];
            const uniqueFiles = Array.from(new Map(combinedFiles.map(file => [file.file_id, file])).values());
            setFiles(uniqueFiles);
          }
          
          setHasMore(response.results.length === 10);
          if (isRefresh) {
            setPage(0);
          }
        } catch (error) {
          console.error('Error loading files:', error);
        } finally {
          setLoading(false);
        }
      }, [page, files]);
  
    // Check for duplicate file names
    const getDuplicateStatus = (fileName) => {
        return files.filter(file => file.file_name === fileName).length > 1;
    };

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    useEffect(() => {
        if (refreshTrigger > 0) {
          loadFiles(true); // Pass true to indicate this is a refresh
        }
    }, [refreshTrigger, loadFiles]);

    const LoadingIndicator = () => (
        <div className="flex items-center justify-center p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="h-6 w-6 rounded-full bg-white"></div>
            </div>
          </div>
          <span className="ml-3 text-gray-600">Updating files...</span>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Files</h2>
            <span className="text-sm text-gray-500">
              {files.length} total files
            </span>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading files...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => {
                const isDuplicate = getDuplicateStatus(file.file_name);
                return (
                  <div
                    key={file.file_id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedFiles.includes(file.file_id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : isDuplicate 
                          ? 'border-yellow-300 hover:border-yellow-400'
                          : 'hover:border-gray-300'
                    }`}
                    onClick={() => onFileSelect(file.file_id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{file.file_name}</h3>
                          {isDuplicate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Duplicate
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                        {isDuplicate && (
                          <p className="text-xs text-yellow-600 mt-1">
                            File ID: {file.file_id.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                      {selectedFiles.includes(file.file_id) && (
                        <span className="text-blue-500 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
  
          {!loading && hasMore && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="mt-4 text-blue-500 hover:text-blue-700 font-medium flex items-center"
            >
              Load More
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
    );
}