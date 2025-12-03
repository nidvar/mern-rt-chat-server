// import environmental requirements
import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 3000;

// import libraries
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';

// import other files
import authRouter from './routes/auth.route';
import messageRouter from './routes/message.route';
import { connectDB } from './lib/db';
import { limiter } from './lib/rateLimit';
import { authMiddleware } from './middleware/authMiddleware';
import { app, server } from './lib/socket';

// trust proxy for production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
} else {
    app.set('trust proxy', false);
}

// Allowed origins
const allowedOrigins = [
    'http://localhost:5173',
    'https://jarrochat.vercel.app',
    'https://jarrochat.onrender.com',
];

// CORS middleware
app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true,
}));

// Cookie parser and body parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/auth', limiter, authRouter);
app.use('/messages', limiter, authMiddleware, messageRouter);

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// SPA catch-all (for non-API routes only)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/messages')) {
    return next(); // skip to API route if it exists
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Connect to MongoDB
connectDB();

// Start server
server.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
