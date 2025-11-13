import { Response, Request } from 'express';

export const checkAuth = function(req: Request, res: Response, next: () => void){
    try{
        console.log('cookies !! ===== ', req.cookies);
        next();
    }catch(error){
        console.log(error);
    }
}