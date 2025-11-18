import express from 'express';
import { getAllContacts } from '../controllers/message.controller';

const router = express.Router();

router.get('/contacts', getAllContacts);

// router.get('/:id', getMessagesByUserId);
// router.get('/chats', getChatPartners);

// router.post('/send/:id', sendMessage);



export default router;