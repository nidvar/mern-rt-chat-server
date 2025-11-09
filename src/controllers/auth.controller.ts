import type { Request, Response } from 'express';

import bcryptjs from 'bcryptjs';

import User from '../models/User';

export const login = (req: Request, res: Response)=>{
    try{
        const user = User.findOne({ email: req.body.email });
        return res.json({message: 'login'});
    }catch(error){
        return res.status(500).json({message: error});
    }
}

export const logout = (req: Request, res: Response)=>{
    try{
        return res.json({message: 'logged out'});
    }catch(error){
        return res.status(500).json({message: error});
    }
}

export const signup = (req: Request, res: Response)=>{
    try{
        return res.json({message: 'signed up'});
    }catch(error){
        return res.status(500).json({message: error});
    }
}