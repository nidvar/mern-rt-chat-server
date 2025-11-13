import jwt from 'jsonwebtoken';

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
}