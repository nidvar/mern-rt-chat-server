import express from 'express';

import { login, signup, logout, checkAuth } from '../controllers/auth.controller';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);

router.get('/checkAuth', checkAuth);

export default router;