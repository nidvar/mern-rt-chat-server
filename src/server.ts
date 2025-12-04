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
console.log('Setting trust proxy');
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
    } else {
        console.log("No body sent with request");
    }
    next();
});

// ---------------------
// CORS
// ---------------------
console.log('Setting up CORS');
app.use(cors({
  origin: true,
  credentials: true
}));

// ---------------------
// Body parsers
// ---------------------
console.log('Setting up body parsers and cookie parser');
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------
// API ROUTES
// ---------------------
console.log('Setting up API routes');

app.use('/auth', limiter, (req, res, next) => {
    console.log("➡ Hit /auth route");
    next();
}, authRouter);

app.use('/messages', limiter, authMiddleware, (req, res, next) => {
    console.log("➡ Hit /messages route");
    next();
}, messageRouter);

// ---------------------
// Response logging
// ---------------------
app.use((req, res, next) => {
    console.log('Wrapping res.send to log outgoing responses');
    const originalSend = res.send;
    res.send = function(body?: any) {
        console.log("⬅ Response for", req.path);
        console.log("Status:", res.statusCode);
        const contentType = res.getHeader('Content-Type');
        if (contentType && typeof contentType === 'string') {
            console.log("Content-Type:", contentType);
            if (contentType.includes('application/json')) {
                try {
                    console.log("Body (parsed JSON):", JSON.stringify(JSON.parse(body), null, 2));
                } catch (err) {
                    console.log("Failed to parse JSON, raw body:", body, "Error:", err);
                }
            } else {
                console.log("Non-JSON response (maybe HTML):", body?.toString().slice(0, 100));
            }
        } else {
            console.log("No Content-Type header, body preview:", body?.toString().slice(0, 100));
        }
        return originalSend.call(this, body);
    };
    next();
});

// ---------------------
// FRONTEND SERVING
// ---------------------
const publicPath = path.join(process.cwd(), 'public'); // project root, not dist
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));

// SPA fallback: only for non-API GET requests
app.use((req, res, next) => {
    console.log("➡ SPA fallback check for path:", req.path);
    if (req.path.startsWith('/auth') || req.path.startsWith('/messages')) {
        console.log("Skipping SPA fallback for API path:", req.path);
        return next();
    }

    if (req.method !== 'GET') {
        console.log("Skipping SPA fallback for non-GET method:", req.method);
        return next();
    }

    console.log("📄 Serving SPA fallback index.html for path:", req.path);
    res.sendFile(path.join(publicPath, 'index.html'), (err) => {
        if (err) {
            console.error("❌ Error sending index.html:", err);
            res.status(500).send('Server error');
        } else {
            console.log("✅ index.html served successfully");
        }
    });
});

// ---------------------
// DATABASE + SERVER
// ---------------------
console.log('Connecting to database...');
connectDB();

server.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
