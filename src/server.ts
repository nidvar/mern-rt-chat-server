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

// TRUST PROXY (Render uses proxies)
app.set('trust proxy', 1);

// Allowed origins
const allowedOrigins = [
    'http://localhost:5173',
    'https://jarrochat.vercel.app',
    'https://jarrochat.onrender.com',
];

// CORS middleware
app.use(cors({
    origin: (origin, callback) => {
        // allow no-origin requests (mobile, curl, server)
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

// ---------------------
// API ROUTES
// ---------------------
app.use('/auth', limiter, authRouter);
app.use('/messages', limiter, authMiddleware, messageRouter);

// ---------------------
// STATIC FRONTEND
// ---------------------

// IMPORTANT: Serve from project root (NOT dist)
// This works on Render!
const publicPath = path.join(process.cwd(), 'public');

// Serve static React build
app.use(express.static(publicPath));

// SPA fallback for React
app.get('*', (req, res) => {
    // prevent API routes from falling into the SPA
    if (req.path.startsWith('/auth') || req.path.startsWith('/messages')) {
        return res.status(404).json({ message: 'API route not found' });
    }

    res.sendFile(path.join(publicPath, 'index.html'));
});

// Connect to MongoDB
connectDB();

// Start server
server.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
