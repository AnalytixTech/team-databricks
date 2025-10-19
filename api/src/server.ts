import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { config } from './config/env';
import routes from './routes';
import swaggerRoutes from './routes/swagger.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { startCronJobs } from './utils/cron.jobs';
import { RATE_LIMIT } from './utils/constants';
import passport from './config/passport';
import { initializeSocket } from './socket/chat.socket';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Security headers

// CORS configuration - Allow both production and development URLs
const allowedOrigins = [
  config.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  'https://fleetly-6j7s.onrender.com', // Production frontend
];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

app.use(express.json({ limit: '10mb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Initialize passport
app.use(passport.initialize());

// API Documentation (Swagger)
app.use('/api-docs', swaggerRoutes);

// API Routes
app.use('/api', routes);

// Health check (outside rate limiter)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    message: 'Fleetly Car Rental Backend',
    version: '2.0.0',
    documentation: '/api-docs',
  });
});

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

// Start server
const PORT = config.PORT || 5000;

const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

const server = httpServer.listen(PORT, () => {
  const apiDocsUrl = config.NODE_ENV === 'production' 
    ? `https://api-fleetly.onrender.com/api-docs`
    : `http://localhost:${PORT}/api-docs`;
  
  console.log(`
╔══════════════════════════════════════════════╗
║     Fleetly Car Rental Backend               ║
║     Server running on port ${PORT}              ║
║     Environment: ${config.NODE_ENV.padEnd(18)}          ║
║     Database: Connected                      ║
║     Socket.IO: Initialized                   ║
║     Frontend URL: ${config.FRONTEND_URL.padEnd(24)}     ║
║     API Docs: ${apiDocsUrl.padEnd(31)}          ║
╚══════════════════════════════════════════════╝
  `);

  // Start cron jobs
  startCronJobs();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;

