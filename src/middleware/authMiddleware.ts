import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import { genAccessToken, createCookie } from '../utils/utils';

type JwtPayload = {
    username: string
    email: string
    iat?: number;
    exp?: number;
}

export const authMiddleware = async function(req: Request, res: Response, next: NextFunction){
    try{
        if(!req.cookies.accessToken && !req.cookies.refreshToken){
            console.log('there are no cookies at all');
            res.locals.user = null;
            return next();
        }
        if(req.cookies.accessToken){
            try{
                const accessDetails = jwt.verify(req.cookies.accessToken, process.env.ACCESS_SECRET!) as JwtPayload;
                if(accessDetails){
                    console.log('there is an access token');
                    res.locals.user = accessDetails;
                    return next();
                }
            }catch{
                console.log('expired access token');
                res.locals.user = null;
                return next();
            }
        }
        if(req.cookies.refreshToken){
            try{
                console.log('refreshing token -=====-=-=-=-=-=-=')
                const refreshDetails = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET!) as JwtPayload;

                if(refreshDetails){
                    const user = await User.findOne({ email: refreshDetails.email });

                    if(!user || user.refreshToken !== req.cookies.refreshToken){
                        console.log('Invalid token');
                        res.locals.user = null;
                        return next();
                    };
                    const payload = {
                        username: refreshDetails.username,
                        email: refreshDetails.email
                    }
                    const accessToken = genAccessToken(payload);
                    createCookie(res, 'accessToken', accessToken, 10 * 60 * 1000);
                    res.locals.user = refreshDetails;
                    return next();
                }
            }catch{
                console.log('expired refresh token');
                res.locals.user = null;
                return next();
            }
        }
        return next();
    }catch(error){
        const err = error as Error
        console.log(err);
        return res.status(500).json({ message: err.message})
    }
}