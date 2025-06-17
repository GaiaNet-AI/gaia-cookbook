// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const app = express();

/**
 * Middleware to configure CORS settings.
 * Allows requests from the specified frontend URL or localhost.
*/
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
  
app.use(express.json());

// Constants
const SUPAVEC_API = 'https://api.supavec.com';
const GAIA_API = 'https://llama3b.gaia.domains/v1/chat/completions';

/**
 * Multer storage configuration for handling file uploads.
 * Stores files in the 'uploads' directory with a unique filename.
*/
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Store files in an 'uploads' directory
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      // Create unique filename using timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

/**
 * Multer instance with storage configuration and file size/type limits.
 * Limits file size to 100MB and accepts only PDF and text files.
*/
const upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // Limit file size to 100MB
    },
    fileFilter: function(req, file, cb) {
      // Accept only PDF and text files
      if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and text files are allowed'));
      }
    }
});

const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

/**
 * Utility function to make requests to the Supavec API.
 * @param {string} endpoint - The API endpoint to call.
 * @param {object} options - The request options (method, headers, data, etc.).
 * @returns {Promise<object>} - The response data from the API.
 * @throws {Error} - Throws an error if the request fails.
*/
const makeSupavecRequest = async (endpoint, options) => {
  try {
    const response = await axios({
      url: `${SUPAVEC_API}/${endpoint}`,
      headers: {
        authorization: process.env.SUPAVEC_API_KEY,
        ...options.headers
      },
      ...options
    });
    return response.data;
  } catch (error) {
    console.error(`Error making Supavec request to ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * API route to upload a file to Supavec.
 * Uses multer middleware to handle file upload.
 * @route POST /api/upload
*/
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      // Create FormData for Supavec API
      const formData = new FormData();
      formData.append('file', 
        fs.createReadStream(req.file.path),
        { filename: req.file.originalname }
      );
  
      // Make request to Supavec API
      const response = await makeSupavecRequest('upload_file', {
        method: 'POST',
        data: formData,
      });
  
      // Clean up the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
      });
  
      res.json(response);
    } catch (error) {
      // Clean up the uploaded file in case of error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temporary file:', err);
        });
      }
  
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: error.message,
        details: error.response?.data || 'Upload failed'
      });
    }
});

/**
 * API route to upload text content to Supavec.
 * @route POST /api/upload-text
*/
app.post('/api/upload-text', async (req, res) => {
  try {
    const { name, contents } = req.body;
    const response = await makeSupavecRequest('upload_text', {
      method: 'POST',
      data: { name, contents }
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API route to get a list of uploaded files.
 * @route GET /api/files
*/
app.get('/api/files', async (req, res) => {
  try {
    const { limit = 10, offset = 0, order_dir = 'desc' } = req.query;
    const response = await makeSupavecRequest('user_files', {
      method: 'POST',
      data: {
        pagination: { limit: parseInt(limit), offset: parseInt(offset) },
        order_dir
      }
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API route to search embeddings.
 * @route POST /api/search
*/
app.post('/api/search', async (req, res) => {
  try {
    const { query, file_ids, k = 3 } = req.body;
    const response = await makeSupavecRequest('embeddings', {
      method: 'POST',
      data: { query, file_ids, k }
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API route to ask questions about documents using Gaia.
 * @route POST /api/ask
*/
app.post('/api/ask', async (req, res) => {
  try {
    const { question, context } = req.body;
    
    // Format the prompt with context
    const prompt = `Context from documents: ${context}\n\nQuestion: ${question}\n\nAnswer based on the provided context:`;
    
    const response = await axios.post(GAIA_API, {
      messages: [
        { role: 'system', content: 'You are a helpful assistant that answers questions based on provided document context.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama'
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Error handling middleware for multer errors.
*/
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File is too large. Maximum size is 10MB'
        });
      }
      return res.status(400).json({
        error: error.message
      });
    }
    next(error);
});

/**
 * Start the server and listen on the specified port.
*/
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});