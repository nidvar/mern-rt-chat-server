import express from 'express';

import { login, signup, logout } from '../controllers/auth.controller';

import { checkAuth } from '../middleware/checkAuth';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);

router.get('/checkAuth', checkAuth, (_, res)=>{ return res.json({message: 'check working'});})

export default router;