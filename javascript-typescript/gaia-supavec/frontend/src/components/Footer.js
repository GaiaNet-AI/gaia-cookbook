import React from 'react';

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Documentation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Documentation</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://docs.supavec.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Supavec Docs
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.gaianet.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Gaia Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Project Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Project</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/harishkotra/supavec-gaia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/harishkotra/supavec-gaia/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Report an Issue
                </a>
              </li>
            </ul>
          </div>

          {/* Developer Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Developer</h3>
            <p className="text-gray-300">
              Built with ❤️ by{' '}
              <a 
                href="https://github.com/harishkotra" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transition-colors"
              >
                Harish Kotra
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}