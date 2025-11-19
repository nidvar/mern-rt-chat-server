import type { Request, Response } from 'express';

import User from '../models/User';
import Message from '../models/message';

import { uploadImageCloudinary } from '../utils/utils';


export const getAllContacts = async (req: Request, res: Response)=>{
    try{
        console.log('req body ============ >>>>>>>> ', req.body);
        console.log('res.locals.user >>>>>>>> ', res.locals.user);

        const AllOtherUsers = await User.find({email: { $ne: res.locals.user.email }}).select("-updatedAt -password -refreshToken -__v");

        console.log(AllOtherUsers);

        return res.json({message: 'all contacts', users: AllOtherUsers});
    }catch(error){
        console.log(error);
    }
};

export const getMessagesByUserId = async (req: Request, res: Response)=>{
    try{
        const myId = res.locals.user.email;
        const recieverId = req.params.id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, recieverId: recieverId },
                { senderId: recieverId, recieverId: myId }
            ]
        });
        res.status(200).json(messages)
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
}