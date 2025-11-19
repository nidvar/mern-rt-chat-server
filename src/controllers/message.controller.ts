import type { Request, Response } from 'express';

import User from '../models/User';

export const getAllContacts = async (req: Request, res: Response)=>{
    try{
        console.log('req body ============ >>>>>>>> ', req.body);
        console.log('res.locals.user >>>>>>>> ', res.locals.user);

        const AllOtherUsers = await User.find({   email: { $ne: res.locals.user.email }   }).select("-updatedAt -password -refreshToken -__v");

        console.log(AllOtherUsers);

        return res.json({message: 'all contacts', users: AllOtherUsers});
    }catch(error){
        console.log(error);
    }
};