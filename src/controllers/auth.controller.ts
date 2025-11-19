import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import User from '../models/User';
import { genAccessToken, genRefreshToken, createCookie, clearCookie, uploadImageCloudinary } from '../utils/utils';


export const login = async (req: Request, res: Response)=>{
    try{
        if(req.body.password.length < 6 || req.body.email === ''){
            return res.status(400).json({ message: 'Invalid credentials'});
        };
        const user = await User.findOne({ email: req.body.email });
        if(!user){
            return res.status(400).json({ message: 'Invalid credentials'});
        };
        const passwordCheck = await bcrypt.compare(req.body.password, user.password);
        if(passwordCheck){
            const tokenPayload = {
                username: user.username,
                email: user.email,
                profilePic: user.profilePic,
                id: user._id
            }
            const accessToken = genAccessToken(tokenPayload);
            createCookie(res, 'accessToken', accessToken, 10 * 60 * 1000);

            const refreshToken = genRefreshToken(tokenPayload);
            createCookie(res, 'refreshToken', refreshToken, 3* 60 * 60 * 1000);
            user.refreshToken = refreshToken;
            await user.save();
            return res.json({
                message: 'logged In as ' + user.username,
                userData: tokenPayload
            });
        };
        return res.status(400).json({message: 'Invalid credentials'});
    }catch{
        return res.status(500).json({message: 'Server Error'});
    }
}

export const logout = async (req: Request, res: Response)=>{
    try{
        console.log('logging out !')
        const user = await User.findOne({refreshToken: req.cookies.refreshToken});
        if(user){
            user.refreshToken = '';
            await user.save();
        }
        clearCookie(res, 'accessToken');
        clearCookie(res, 'refreshToken');
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

            const cloudinaryImageURL = await uploadImageCloudinary(req.body.profilePic);
            const newUser = {
                email: req.body.email,
                username: req.body.username,
                password: hashedPassword,
                profilePic: cloudinaryImageURL? cloudinaryImageURL : ''
            };

            await User.create(newUser);
            return res.json({message: 'sign up success'});
        }
        return res.json({message: 'Server Error'});
    }catch(error){
        return res.status(500).json({message: error});
    }
}

export const updateProfile = async function(req: Request, res: Response){
    try{
        console.log('update profile==========', res.locals.user);
        if(res.locals.user != null){
            console.log('There is a res locals')
            const user = await User.findOne({ email: res.locals.user.email });
            if(user){
                console.log('There is a mongodb user');
                const cloudinaryImageURL = await uploadImageCloudinary(req.body.profilePic);
                user.profilePic = cloudinaryImageURL as string;
                await user.save();
                return res.json({ message: 'updating profile' });
            };
        }
        return res.status(400).json({message: 'User not found'});
    }catch(error){
        res.status(500).json({ message: (error as Error).message });
    }
};

export const checkAuth = async function(req: Request, res: Response){
    try{
        if(res.locals.user !== null){
            console.log("user is not null");
            return res.json({isLoggedIn: true, userData: res.locals.user});
        }else{
            console.log("user is null");
            return res.json({isLoggedIn: false, userData: null});
        }
    }catch(error){
        const err = error as Error
        return res.status(500).json({ message: err.message})
    }
}