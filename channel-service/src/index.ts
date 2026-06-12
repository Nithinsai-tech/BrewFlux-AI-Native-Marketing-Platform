import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import channelRouter from './routes/channel.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware configuration
app.use(cors());
app.use(express.json());

// API Routes
app.use('/', channelRouter);

// Global Error Handler
app.use(errorHandler);

// Start listening
app.listen(PORT, () => {
  logger.info(`Independent Channel Service running on port ${PORT}`);
});
