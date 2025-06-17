const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  const message = error.response?.data?.error || error.message || 'An error occurred';
  throw new Error(message);
};

// Helper function for making API requests
const makeRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Uploads a file to the server.
 * @param {File} file - The file to upload.
 * @returns {Promise<object>} - The response data from the server.
*/
export const uploadFile = async (file) => {
  try {
    // Create a new FormData instance
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'File upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Uploads text content to the server.
 * @param {string} name - The name of the text content.
 * @param {string} contents - The text content to upload.
 * @returns {Promise<object>} - The response data from the server.
*/
export const uploadText = async (name, contents) => {
  return makeRequest('/upload-text', {
    method: 'POST',
    body: JSON.stringify({ name, contents }),
  });
};

// Get list of files
export const getFiles = async (offset = 0, limit = 10) => {
  return makeRequest(`/files?offset=${offset}&limit=${limit}`);
};

/**
 * Searches embeddings based on a query and file IDs.
 * @param {string} query - The search query.
 * @param {Array<string>} fileIds - The IDs of the files to search within.
 * @param {number} k - The number of results to return.
 * @returns {Promise<object>} - The response data from the server.
*/
export const searchEmbeddings = async (query, file_ids, k = 3) => {
  return makeRequest('/search', {
    method: 'POST',
    body: JSON.stringify({ query, file_ids, k }),
  });
};

/**
 * Asks a question about documents using Gaia.
 * @param {string} question - The question to ask.
 * @param {string} context - The context from documents to provide for the question.
 * @returns {Promise<object>} - The response data from the server.
*/
export const askQuestion = async (question, context) => {
  return makeRequest('/ask', {
    method: 'POST',
    body: JSON.stringify({ question, context }),
  });
};