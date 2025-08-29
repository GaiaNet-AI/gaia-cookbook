import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { chatRoutes } from './routes/chat.js';
import { storageRoutes } from './routes/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/chat', chatRoutes);
app.use('/api/storage', storageRoutes);

app.get('/api/config', (req, res) => {
  res.json({
    reownProjectId: process.env.REOWN_PROJECT_ID,
    gaiaNodeUrl: process.env.GAIA_NODE_URL
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});