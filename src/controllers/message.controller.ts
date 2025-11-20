import type { Request, Response } from 'express';

import User from '../models/User';
import Message from '../models/message';

import { uploadImageCloudinary } from '../utils/utils';


export const getAllContacts = async (req: Request, res: Response)=>{
    try{
        const AllOtherUsers = await User.find({ email: { $ne: res.locals.user.email }}).select("-updatedAt -password -refreshToken -__v");
        return res.json({message: 'all contacts', users: AllOtherUsers});
    }catch(error){
        console.log(error);
    }
};

export const getMessagesByUserId = async (req: Request, res: Response)=>{
    try{
        const myId = res.locals.user.id;
        const recieverId = req.params.id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, recieverId: recieverId },
                { senderId: recieverId, recieverId: myId }
            ]
        });
        res.status(200).json(messages);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'server error'})
    }
};

export const sendMessage = async (req: Request, res: Response)=>{
    try{
        const myId = res.locals.user.id;
        const recieverId = req.params.id;

        let imageUrl;

        if(req.body.image){
            imageUrl = await uploadImageCloudinary(req.body.profilePic);
        };

        const message = new Message({
            senderId: myId,
            recieverId: recieverId,
            text: req.body.text,
            image: imageUrl
        })

        await message.save();

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'server error'})
    }
};

export const getChatPartners = async (req: Request, res: Response)=>{
    try{
        const allMessages = await Message.find({
            $or: [
                { senderId: res.locals.user.id },
                { recieverId: res.locals.user.id }
            ]
        });

        const chatPartnerIds = allMessages.map((item)=>{
            if(item.senderId.toString() === res.locals.user.id){
                return item.recieverId;
            }else{
                return item.senderId;
            };
        });
        const allChatPartners = await User.find({_id: {$in: chatPartnerIds}}).select("-password -refreshToken");
        return res.status(200).json(allChatPartners);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'server error'})
    }
};