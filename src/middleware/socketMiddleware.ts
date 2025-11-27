import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import jwt from 'jsonwebtoken';

import User from '../models/User';

type JwtPayload = {
    username: string
    id: string
    iat?: number;
    exp?: number;
}

export const socketMiddleware = async (
    socket: Socket,
    next: (err?: ExtendedError) => void
) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie;
        console.log('cookies from socket middleware------->')
        if (!cookieHeader) {
            return next(new Error("No cookies"));
        }

        // Parse cookies manually
        const cookies = Object.fromEntries(
            cookieHeader.split(";").map((c) => {
                const [key, value] = c.trim().split("=");
                return [key, value];
            })
        );

        const accessToken = cookies.accessToken;
        const refreshToken = cookies.refreshToken;

        if (!accessToken && !refreshToken) {
            return next(new Error("No tokens"));
        }

        // Try access token
        try {
            const decoded = jwt.verify(
                accessToken,
                process.env.ACCESS_SECRET!
            ) as JwtPayload;

            socket.data.user = decoded;
            return next();
        } catch (err) {
            console.log("socket access token expired");
        }

        // Try refresh token
        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_SECRET!
            ) as JwtPayload;

            // Optionally fetch user:
            // const user = await User.findById(decoded.id);

            if(decoded){
                const user = await User.findById(decoded.id);
                if(user && user.refreshToken === refreshToken){
                    socket.data.user = decoded;
                    return next();
                }
            }
        } catch (err) {
            return next(new Error("Socket auth failed"));
        }
    } catch (err) {
        next(new Error("Auth error"));
    }
};