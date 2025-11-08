import express from 'express';

import { login } from '../controllers/auth.controller.ts';

const router = express.Router();

router.get('/login', login)

router.get('/logout', (req, res)=>{
    res.send('logout')
});

export default router;