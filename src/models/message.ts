import mongoose from 'mongoose';

import User from './User';

const MessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true,
    },
    recieverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true,
    },
    text: {
        type: String
    },
    image: {
        type: String
    }
}, { timestamps: true });

const Message = mongoose.model('Message', MessageSchema);

export default Message;