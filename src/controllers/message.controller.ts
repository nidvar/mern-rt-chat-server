import type { Request, Response } from 'express';

export const getAllContacts = async (req: Request, res: Response)=>{
    try{
        console.log(req.body);

        return res.json({message: 'all contacts'});
    }catch(error){
        console.log(error);
    }
};