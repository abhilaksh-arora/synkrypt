import express from 'express';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import organizationRoutes from './routes/organizationRoutes';
import projectRoutes from './routes/projectRoutes';

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

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0' }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/orgs', organizationRoutes);
app.use('/projects', projectRoutes);   // standalone /projects/:id, /projects/by-key/:key

export default app;
