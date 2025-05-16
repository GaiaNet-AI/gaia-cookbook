import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { uploadFile } from '../utils/api';

export function FileUpload({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setFile(null);
        setError('Please select a PDF or text file');
      }
    };
  
    const handleFileUpload = async (e) => {
      e.preventDefault();
      if (!file) return;
  
      setLoading(true);
      setError(null);
      setUploadProgress(0);
  
      try {
        const response = await uploadFile(file);
        setUploadProgress(100);
        onUploadSuccess(response.file_id);
        setFile(null);
        
        // Reset the file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        
        toast.success('File uploaded successfully!');
      } catch (error) {
        setError(error.message || 'Error uploading file');
        toast.error(error.message || 'Error uploading file');
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
        
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.txt"
            />
            <label 
              htmlFor="file-input"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="mt-2 text-sm text-gray-600">
                {file ? file.name : 'Drop file here or click to select'}
              </span>
              <span className="mt-1 text-xs text-gray-500">
                PDF or TXT files only (max 100MB)
              </span>
            </label>
          </div>
  
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
  
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
  
          <button
            type="submit"
            disabled={!file || loading}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
              !file || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>
    );
}