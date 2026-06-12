import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import routes
import customersRouter from './routes/customers.js';
import campaignsRouter from './routes/campaigns.js';
import receiptRouter from './routes/receipt.js';
import agentRouter from './routes/agent.js';
import insightsRouter from './routes/insights.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xenocrm';

// Middleware
app.use(cors());
app.use(express.json());

// Share Socket.IO server with routes
app.set('io', io);
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/customers', customersRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/receipt', receiptRouter);
app.use('/api/receipts', receiptRouter); // backward compatibility
app.use('/api/agent', agentRouter);
app.use('/api/insights', insightsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'CRM Backend' });
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Subscribe to campaign room
  socket.on('join_campaign', (campaignId) => {
    socket.join(`campaign:${campaignId}`);
    console.log(`Client ${socket.id} joined room campaign:${campaignId}`);
  });

  socket.on('leave_campaign', (campaignId) => {
    socket.leave(`campaign:${campaignId}`);
    console.log(`Client ${socket.id} left room campaign:${campaignId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Connect to Database and start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`CRM Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
