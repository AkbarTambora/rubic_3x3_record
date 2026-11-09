import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import sessionsRoutes from './routes/sessions.routes';
import solvesRoutes from './routes/solves.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Mount Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/solves', solvesRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'CubeStudio 3x3 Backend REST API',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        profile: 'PATCH /api/auth/profile',
        privacy: 'PATCH /api/auth/privacy',
        publicUser: 'GET /api/auth/users/:username'
      },
      sessions: {
        list: 'GET /api/sessions',
        create: 'POST /api/sessions',
        update: 'PATCH /api/sessions/:id'
      },
      solves: {
        list: 'GET /api/solves',
        create: 'POST /api/solves',
        update: 'PATCH /api/solves/:id',
        delete: 'DELETE /api/solves/:id',
        sync: 'POST /api/solves/sync'
      }
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 CubeStudio Backend API running on port ${PORT}`);
  console.log(`📡 Healthcheck: http://localhost:${PORT}/api/health`);
});
