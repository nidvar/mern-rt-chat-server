import express from 'express';
import { getAllContacts, sendMessage, getMessagesByUserId } from '../controllers/message.controller';

const router = express.Router();


router.get('/contacts', getAllContacts);
router.get('/chats', getAllContacts);
router.post('/send/:id', sendMessage);
router.get('/:id', getMessagesByUserId);




export default router;