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

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
} else {
    app.set('trust proxy', false);
}

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// SPA catch-all (must come after API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const allowedOrigins = [
    'http://localhost:5173',
    'https://jarrochat.vercel.app',
    'https://jarrochat.onrender.com',
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true,
}));


app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/auth', limiter, authRouter);
app.use('/messages', limiter, authMiddleware, messageRouter);

connectDB();

server.listen(PORT, ()=>{
    console.log('port running on', PORT);
});
