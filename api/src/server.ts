import express, { Application } from 'express';
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { config } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { RATE_LIMIT } from "./utils/constants";
import passport from './config/passport';


// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: config.FRONTEND_URL, credentials: true })); // CORS
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

app.use("/api", limiter);

// Initialize passport
app.use(passport.initialize());

// API Routes
app.use('/api', routes);

// Health check
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
    message: 'Team Databricks Backend',
    version: '2.0.0',
  });
}); 

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

const port = config.PORT || 5001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;