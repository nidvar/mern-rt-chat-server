import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

import { connectDB } from './lib/db';
import authRouter from './routes/auth.route';
import messageRouter from './routes/message.route';
import { limiter } from './lib/rateLimit';
import { authMiddleware } from './middleware/authMiddleware';
import { app, server } from './lib/socket';

const PORT = process.env.PORT || 3000;

// TRUST PROXY for Render
app.set('trust proxy', 1);

// CORS (allow all origins now unnecessary because same-origin)
app.use(cors({
  origin: true, // allow same-origin requests
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------
// API ROUTES
// ---------------------
app.use('/auth', limiter, authRouter);
app.use('/messages', limiter, authMiddleware, messageRouter);

// ---------------------
// FRONTEND SERVING
// ---------------------
const publicPath = path.join(process.cwd(), 'public'); // <-- project root, not dist
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/messages')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ---------------------
// DATABASE + SERVER
// ---------------------
connectDB();

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
