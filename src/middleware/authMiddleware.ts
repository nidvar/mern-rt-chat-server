import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import { genAccessToken, genRefreshToken, createCookie } from '../utils/utils';

type JwtPayload = {
    username: string
    email: string
    profilePic: string
    iat?: number;
    exp?: number;
}


// SOFT MIDDLEWARE
export const authMiddleware = async function(req: Request, res: Response, next: NextFunction){
    console.log('middleware start ========================= ')
    try{
        if(!req.cookies.accessToken && !req.cookies.refreshToken){
            console.log('there are no cookies at all');
            res.locals.user = null;
            return next();
        };

        if(req.cookies.accessToken){
            console.log('verifying access token....');
            try {
                const accessDetails = jwt.verify(req.cookies.accessToken, process.env.ACCESS_SECRET!) as JwtPayload;
                if(accessDetails){
                    console.log('access token win')
                    res.locals.user = accessDetails;
                    return next();
                }
            } catch (err) {
                console.log('access token fail, now attempting to refresh');
                console.log(err);
                try{
                    const refreshDetails = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_SECRET!) as JwtPayload;
                    if(refreshDetails){
                        const user = await User.findOne({ email: refreshDetails.email });
                        if(!user){
                            console.log('user not found');
                            res.locals.user = null;
                            return next();
                        }
                        console.log('check database');
                        if(user.refreshToken === req.cookies.refreshToken){
                            console.log('db refresh token verified')
                            const tokenPayload = {
                                username: user.username,
                                email: user.email,
                                profilePic: user.profilePic
                            }
                            const accessToken = genAccessToken(tokenPayload);
                            createCookie(res, 'accessToken', accessToken, 10 * 60 * 1000);

                            const refreshToken = genRefreshToken(tokenPayload);
                            createCookie(res, 'refreshToken', refreshToken, 3* 60 * 60 * 1000);
                            user.refreshToken = refreshToken;
                            await user.save();
                        }
                    }

                }catch(err){
                    console.log(err);
                    console.log('refresh token fail');
                    res.locals.user = null;
                    return next();
                }
                return next();
            }
        }
        console.log('there is no access token')
        res.locals.user = null;
        return next();
    }catch(error){
        const err = error as Error
        console.log(err);
        return res.status(500).json({ message: err.message})
    }
}