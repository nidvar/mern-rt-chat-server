import dotenv from 'dotenv';
dotenv.config();

import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import { socketMiddleware } from '../middleware/socketMiddleware';
import Message from '../models/message';

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

const sendAllMessages = async function(userId: string){
    try{
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
        console.log(err);
    }
};

io.on('connection', async (socket)=>{
    userSocketMap[socket.data.user.id] = socket.id.toString();
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    await sendAllMessages(socket.data.user.id);

    socket.on('sendMessage', async (data: {recieverId: string, text?: string, image?: string})=>{
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
            console.log(err);
        }
    })

    socket.on('disconnect', ()=>{
        console.log(socket.data.user, ' - disconnected from socket');
        delete userSocketMap[socket.data.user.id];
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
});

export { io, app, server }