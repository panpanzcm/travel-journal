import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import notebookRoutes from './routes/notebooks';
import entryRoutes from './routes/entries';
import uploadRoutes from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/upload', uploadRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});