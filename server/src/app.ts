import express from 'express';
import type { Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import auditLogsRoutes from './routes/auditRoutes';
import presetRoutes from './routes/accessPresetRoutes';
import userAssetRoutes from './routes/userAssetRoutes';

const app = express();

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  if (origin && origin === allowedOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '3.5.0' }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/audit-logs', auditLogsRoutes);
app.use('/access-presets', presetRoutes);
app.use('/user-assets', userAssetRoutes);

export default app;
