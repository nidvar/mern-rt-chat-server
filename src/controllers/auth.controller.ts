import type { Request, Response } from 'express';

import bcrypt from 'bcryptjs';

import User from '../models/User';

export const login = async (req: Request, res: Response)=>{
    try{
        // const user = await User.findOne({ email: req.body.email });
        return res.json({message: 'login'});
    }catch(error){
        return res.status(500).json({message: error});
    }
}

export const logout = async (req: Request, res: Response)=>{
    try{
        return res.json({message: 'logged out'});
    }catch(error){
        return res.status(500).json({message: error});
    }
}

export const signup = async (req: Request, res: Response)=>{
    try{
        if(req.body.password.length < 6){
            return res.status(400).json({ message: 'Password length invalid' });
        };
        const userDetails = await Promise.all([
            User.findOne({ email: req.body.email }),
            User.findOne({ username: req.body.username })
        ]);
        if(userDetails[0]){
            return res.status(400).json({ message: 'Email has been taken' });
        };
        if(userDetails[1]){
            return res.status(400).json({ message: 'Username has been taken' });
        };
        if(!userDetails[0] && !userDetails[1]){
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            const newUser = {
                email: req.body.email,
                username: req.body.username,
                password: hashedPassword
            };
            const result = await User.create(newUser);
            return res.json({message: 'signed up'});
        }
        return res.json({message: 'User has not been created???'});
    }catch(error){
        return res.status(500).json({message: error});
    }
}