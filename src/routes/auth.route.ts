import express from 'express';

import { login, signup, logout, checkAuth, updateProfile } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);

router.post('/logout', logout);
router.put('/update', authMiddleware, updateProfile);


router.get('/checkAuth', authMiddleware, checkAuth);

export default router;