import jwt from 'jsonwebtoken';
import { getCloudinary } from '../lib/cloudinary';

export const genAccessToken = function(payload: { username: string, email: string, profilePic: string}){
    return jwt.sign(payload, process.env.ACCESS_SECRET!, {expiresIn: '10m'});
}

export const genRefreshToken = function(payload: {username: string, email: string, profilePic: string}){
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

export const uploadImageCloudinary = async function(image: string){
    try{
        const cloud = getCloudinary();
        const uploadResponse = await cloud.uploader.upload(image);
        if(uploadResponse){
            console.log(uploadResponse.secure_url);
            return uploadResponse.secure_url;
        }else{
            return '';
        }
    }catch(error){
        console.log('==============>',error)
    }
}