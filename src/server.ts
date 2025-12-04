import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';

import authRouter from './routes/auth.route';
import messageRouter from './routes/message.route';
import { authMiddleware } from './middleware/authMiddleware';
import { socketMiddleware } from './middleware/socketMiddleware';
import { limiter } from './lib/rateLimit';
import { connectDB } from './lib/db';
import Message from './models/message';

const app = express();
const server = http.createServer(app);

// TRUST PROXY
app.set('trust proxy', 1);

// ---------------------
// BODY PARSERS + COOKIE
// ---------------------
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------
// CORS
// ---------------------
app.use(cors({ origin: true, credentials: true }));

// ---------------------
// LOGGING MIDDLEWARE
// ---------------------
app.use((req, res, next) => {
  console.log('➡ Incoming Request:', req.method, req.path);
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);
  console.log('Body:', req.body || 'No body sent');
  next();
});

// ---------------------
// API ROUTES
// ---------------------
app.use('/api/auth', limiter, authRouter);
app.use('/api/messages', limiter, authMiddleware, messageRouter);

// ---------------------
// SOCKET.IO
// ---------------------
const allowedOrigins = [
  'https://jarrochat.onrender.com'
];

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      console.log('Socket origin:', origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true
  }
});

io.use(socketMiddleware);

const userSocketMap: Record<string, string> = {};

const sendAllMessages = async function(userId: string) {
  const allMessages = await Message.find({
    $or: [
      { senderId: userId },
      { recieverId: userId }
    ]
  });
  const socketId = userSocketMap[userId];
  if (socketId) io.to(socketId).emit('allMessagesOnLogin', allMessages);
};

io.on('connection', async (socket) => {
  if (!socket.data.user) return;

  console.log('Socket connected:', socket.data.user);
  userSocketMap[socket.data.user.id] = socket.id;
  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  await sendAllMessages(socket.data.user.id);

  socket.on('sendMessage', async (data: {recieverId: string, text?: string, image?: string}) => {
    const newMessage = await Message.create({
      senderId: socket.data.user.id,
      recieverId: data.recieverId,
      text: data.text,
      image: data.image
    });

    const recieverSocketId = userSocketMap[data.recieverId];
    if (recieverSocketId) io.to(recieverSocketId).emit('singleMessage', [newMessage]);
    io.to(socket.id).emit('singleMessage', [newMessage]);
  });

  socket.on('disconnect', () => {
    delete userSocketMap[socket.data.user.id];
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});


// STATIC FRONTEND + SPA FALLBACK
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// SPA fallback: any route NOT starting with /api goes to index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});


// ---------------------
// CONNECT DATABASE + START SERVER
// ---------------------
connectDB();

const PORT = process.env.PORT!;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
