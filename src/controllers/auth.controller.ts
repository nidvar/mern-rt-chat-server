import type { Request, Response } from 'express';

export const login = (req: Request, res: Response)=>{
    try{
        return res.json({message: 'login'})
    }catch(error){
        return res.status(500).json({message: error})
    }
}