import express from 'express';
import { getAllContacts, sendMessage, getMessagesByUserId, getChatPartners } from '../controllers/message.controller';

const router = express.Router();


router.get('/contacts', getAllContacts);
router.get('/chatpartners', getChatPartners);

router.post('/send/:id', sendMessage);

router.get('/:id', getMessagesByUserId);




export default router;