import { NextFunction, Response, Request } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
    username: string
    email: string
    iat?: number;
    exp?: number;
}

export const checkAuth = async function(req: Request, res: Response, next: NextFunction){
    try{
        console.log(req.cookies.refresh)
        if(req.cookies.access){
            const accessDetails = jwt.verify(req.cookies.access, process.env.ACCESS_SECRET!) as JwtPayload;
            if(accessDetails){
                return res.json({message: 'logged In as ' + accessDetails.username});
            }
        }
        if(req.cookies.refresh){
            const refreshDetails = jwt.verify(req.cookies.refresh, process.env.REFRESH_SECRET!) as JwtPayload;
            if(refreshDetails){
                
            }
        }
    }catch(error){
        const err = error as Error
        return res.status(500).json({ message: err.message})
    }
}