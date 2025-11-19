import type { Request, Response } from 'express';

export const getAllContacts = async (req: Request, res: Response)=>{
    try{
        console.log('req body ============ >>>>>>>> ', req.body);
        console.log('res.locals.user >>>>>>>> ', res.locals.user);

        return res.json({message: 'all contacts'});
    }catch(error){
        console.log(error);
    }
};