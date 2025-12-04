import dotenv from 'dotenv';
dotenv.config();

import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import { socketMiddleware } from '../middleware/socketMiddleware';
import Message from '../models/message';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:5173',
    'https://jarrochat.vercel.app',
    'https://jarrochat.onrender.com',
];

const io = new Server(server, {
    cors: {
        origin: function(origin, callback) {
            console.log("Socket origin:", origin); // minimal log
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("CORS not allowed"));
            }
        },
        credentials: true,
    }
});

io.use(socketMiddleware);
const userSocketMap: Record<string, string> = {};

const sendAllMessages = async function(userId: string){
    try{
        console.log("sendAllMessages for user:", userId); // minimal log
        const allMessages = await Message.find({
            $or: [
                { senderId: userId},
                { recieverId: userId}
            ]
        });

        const socketId = userSocketMap[userId];
        if(socketId){
            io.to(socketId).emit('allMessagesOnLogin', allMessages)
        };
    }catch(err){
        console.log("Error in sendAllMessages:", err); // minimal log
    }
};

io.on('connection', async (socket)=>{
    console.log("Socket connected:", socket.data.user); // minimal log
    userSocketMap[socket.data.user.id] = socket.id.toString();
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    await sendAllMessages(socket.data.user.id);

    socket.on('sendMessage', async (data: {recieverId: string, text?: string, image?: string})=>{
        console.log("sendMessage received:", data); // minimal log
        try{
            const newMessage = await Message.create({
                senderId: socket.data.user.id,
                recieverId: data.recieverId,
                text: data.text,
                image: data.image
            });

            const recieverSocketId = userSocketMap[data.recieverId];
            if(recieverSocketId){
                io.to(recieverSocketId).emit('singleMessage', [newMessage])
            }
            io.to(socket.id).emit('singleMessage', [newMessage])
        }catch(err){
            console.log("Error in sendMessage:", err); // minimal log
        }
    })

    socket.on('disconnect', ()=>{
        console.log("Socket disconnected:", socket.data.user); // minimal log
        delete userSocketMap[socket.data.user.id];
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
});

export { io, app, server };