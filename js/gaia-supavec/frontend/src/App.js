import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { ChatInterface } from './components/ChatInterface';

export default function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger refresh
  const handleFileUploadSuccess = (fileId) => {
    setSelectedFiles(prev => [...prev, fileId]);
    // Increment refreshTrigger to force FileList to reload
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <ToastContainer position="top-right" />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <Routes>
                <Route path="/" element={
                  <>
                    <FileUpload onUploadSuccess={handleFileUploadSuccess} />
                    <FileList 
                      onFileSelect={(fileId) => {
                        setSelectedFiles(prev => 
                          prev.includes(fileId) 
                            ? prev.filter(id => id !== fileId)
                            : [...prev, fileId]
                        );
                      }}
                      selectedFiles={selectedFiles}
                      refreshTrigger={refreshTrigger} // Add this prop
                    />
                  </>
                } />
              </Routes>
            </div>
            
            <div className="md:col-span-4">
              <ChatInterface selectedFiles={selectedFiles} />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}