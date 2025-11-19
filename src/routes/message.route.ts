import express from 'express';
import { getAllContacts } from '../controllers/message.controller';

import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/contacts', authMiddleware, getAllContacts);

// router.get('/:id', getMessagesByUserId);
// router.get('/chats', getChatPartners);

// router.post('/send/:id', sendMessage);



export default router;