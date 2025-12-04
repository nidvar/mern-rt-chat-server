import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";
import { Server } from "socket.io";

import authRouter from "./routes/auth.route";
import messageRouter from "./routes/message.route";
import { authMiddleware } from "./middleware/authMiddleware";
import { socketMiddleware } from "./middleware/socketMiddleware";
import { limiter } from "./lib/rateLimit";
import { connectDB } from "./lib/db";
import Message from "./models/message";

const app = express();
const server = http.createServer(app);

// ---------------------
// TRUST PROXY (for cookies) 
// ---------------------
app.set("trust proxy", 1);

// ---------------------
// MIDDLEWARE
// ---------------------
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------------------
// LOGGING MIDDLEWARE
// ---------------------
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// ---------------------
// API ROUTES
// ---------------------
app.use("/api/auth", limiter, authRouter);
app.use("/api/messages", limiter, authMiddleware, messageRouter);

// ---------------------
// SOCKET.IO
// ---------------------
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // allow same-origin or undefined (for ws connections)
      if (!origin || origin === "https://jarro-chat.onrender.com") callback(null, true);
      else callback(new Error("CORS not allowed"));
    },
    credentials: true,
  },
});

io.use(socketMiddleware);

const userSocketMap: Record<string, string> = {};

const sendAllMessages = async (userId: string) => {
  const messages = await Message.find({
    $or: [{ senderId: userId }, { recieverId: userId }],
  });
  const socketId = userSocketMap[userId];
  if (socketId) io.to(socketId).emit("allMessagesOnLogin", messages);
};

io.on("connection", async (socket) => {
  if (!socket.data.user) return;

  console.log(`Socket connected: ${socket.data.user.username}`);
  userSocketMap[socket.data.user.id] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  await sendAllMessages(socket.data.user.id);

  socket.on("sendMessage", async (data: { recieverId: string; text?: string; image?: string }) => {
    const newMessage = await Message.create({
      senderId: socket.data.user.id,
      recieverId: data.recieverId,
      text: data.text,
      image: data.image,
    });

    const recieverSocketId = userSocketMap[data.recieverId];
    if (recieverSocketId) io.to(recieverSocketId).emit("singleMessage", [newMessage]);
    io.to(socket.id).emit("singleMessage", [newMessage]);
  });

  socket.on("disconnect", () => {
    delete userSocketMap[socket.data.user.id];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    console.log(`Socket disconnected: ${socket.data.user.username}`);
  });
});

// ---------------------
// SERVE STATIC FRONTEND
// ---------------------
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) return res.status(404).json({ message: "API route not found" });
  res.sendFile(path.join(publicPath, "index.html"));
});

// ---------------------
// DATABASE + SERVER START
// ---------------------
connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
