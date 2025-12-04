import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import jwt from "jsonwebtoken";
import User from "../models/User";

type JwtPayload = {
  username: string;
  id: string;
  iat?: number;
  exp?: number;
};

export const socketMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return next(new Error("No cookies"));

    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, value] = c.trim().split("=");
        return [key, value];
      })
    );

    const accessToken = cookies.accessToken;
    const refreshToken = cookies.refreshToken;

    if (!accessToken && !refreshToken) return next(new Error("No tokens"));

    // Try access token
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET!) as JwtPayload;
      socket.data.user = decoded;
      return next();
    } catch {
      console.log("Socket access token expired, trying refresh token...");
    }

    // Try refresh token
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET!) as JwtPayload;
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user && user.refreshToken === refreshToken) {
          socket.data.user = decoded;
          return next();
        }
      }
      return next(new Error("Socket auth failed"));
    } catch {
      return next(new Error("Socket auth failed"));
    }
  } catch (err) {
    return next(new Error("Socket auth error"));
  }
};
