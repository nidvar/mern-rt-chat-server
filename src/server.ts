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

// ---------------------
// LOGGING MIDDLEWARE
// ---------------------
app.use((req, res, next) => {
    console.log("➡ Incoming Request:");
    console.log("Method:", req.method);
    console.log("Path:", req.path);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Cookies:", req.cookies);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log("Body:", req.body);
    }
    next();
});

// CORS
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

// Wrap res.send to log responses for debugging
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (body?: any) {
        console.log("⬅ Response for", req.path);
        console.log("Status:", res.statusCode);
        const contentType = res.getHeader('Content-Type');
        if (contentType && typeof contentType === 'string' && contentType.includes('application/json')) {
            try {
                console.log("Body:", JSON.stringify(JSON.parse(body), null, 2));
            } catch {
                console.log("Body:", body);
            }
        } else {
            console.log("Non-JSON response (maybe HTML)");
        }
        return originalSend.call(this, body);
    };
    next();
});

// ---------------------
// FRONTEND SERVING
// ---------------------
const publicPath = path.join(process.cwd(), 'public'); // <-- project root, not dist
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/messages')) {
    console.log("❌ API route not found fallback:", req.path);
    return res.status(404).json({ message: 'API route not found' });
  }
  console.log("📄 Serving SPA fallback:", req.path);
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
      if (err) {
          console.error("Error sending index.html:", err);
          res.status(500).send('Server error');
      }
  });
});

// ---------------------
// DATABASE + SERVER
// ---------------------
connectDB();

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
