import dotenv from 'dotenv';
dotenv.config();

import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import { socketMiddleware } from '../middleware/socketMiddleware';

const allowedOrigins = [
    'http://localhost:5173',
    'https://jarrochat.vercel.app'
];

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    }
});

io.use(socketMiddleware);

const userSocketMap: Record<string, string> = {};

io.on('connection', (socket)=>{
    console.log(socket.data.user, ' - has connected to socket');
    userSocketMap[socket.data.user.id] = socket.id.toString();
    console.log(userSocketMap, ' - user socket map')
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
    socket.on('disconnect', ()=>{
        console.log(socket.data.user, ' - disconnected from socket');
        delete userSocketMap[socket.data.user.id];
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
});

export { io, app, server }