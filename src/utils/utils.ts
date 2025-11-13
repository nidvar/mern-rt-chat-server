import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';

export const genAccessToken = function(payload: { username: string, email: string}){
    return jwt.sign(payload, process.env.ACCESS_SECRET!, {expiresIn: '10m'});
}

export const genRefreshToken = function(payload: {username: string, email: string}){
    return jwt.sign(payload, process.env.REFRESH_SECRET!, {expiresIn: '3h'});
}

export const createCookie = function(response: any, cookieName: string, token: string, age: number){
    const cookieProperties = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        age: age,
        path: '/'
    }
    response.cookie(cookieName, token, cookieProperties);
};

export const clearCookie = function(response: any, cookieName: string){
    const properties = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    }
    response.clearCookie(cookieName, properties)
};

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // Limit each IP to 10 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
    // store: ... , // Redis, Memcached, etc. See below.
})