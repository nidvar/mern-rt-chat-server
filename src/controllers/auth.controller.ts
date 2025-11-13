import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import { genAccessToken, genRefreshToken, createCookie, clearCookie } from '../utils/utils';

type JwtPayload = {
    username: string
    email: string
    iat?: number;
    exp?: number;
}

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
                email: user.email
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
        console.log('logging out !', req.cookies.refreshToken)
        const user = await User.findOne({refreshToken: req.cookies.refreshToken});
        console.log(user);
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
            const newUser = {
                email: req.body.email,
                username: req.body.username,
                password: hashedPassword
            };
            await User.create(newUser);
            return res.json({message: 'sign up success'});
        }
        return res.json({message: 'Server Error'});
    }catch(error){
        return res.status(500).json({message: error});
    }
}

export const checkAuth = async function(req: Request, res: Response){
    try{
        if(!req.cookies.accessToken && !req.cookies.refreshToken){
            console.log('there are no cookies at all');
            return res.json({isLoggedIn: false});
        }
        if(req.cookies.accessToken){
            const accessDetails = jwt.verify(req.cookies.accessToken, process.env.ACCESS_SECRET!) as JwtPayload;
            if(accessDetails){
                console.log('there is an access token');
                return res.json({isLoggedIn: true, userData: accessDetails});
            }
        }
        if(req.cookies.refreshToken){
            const refreshDetails = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET!) as JwtPayload;
            if(refreshDetails){
                console.log('there is a refresh token');
                const user = await User.findOne({ refresh: req.cookies.refreshToken });
                if(user){
                    console.log('there is a user with the refresh token')
                    const tokenPayload = {
                        username: user.username,
                        email: user.email
                    }
                    const accessToken = genAccessToken(tokenPayload);
                    createCookie(res, 'accessToken', accessToken, 10 * 60 * 1000);
                }
                console.log('returning refresh details')
                return res.json({isLoggedIn: true, userData: refreshDetails});
            }
        }
    }catch(error){
        const err = error as Error
        return res.status(500).json({ message: err.message})
    }
}