// import environmental requirements
import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 3000;

// import libraries
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';

// import other files
import authRouter from './routes/auth.route';
import { connectDB } from './lib/db';
import { limiter } from '../src/lib/rateLimit';
import { authMiddleware } from '../src/middleware/authMiddleware';

const app = express();

const allowedOrigins = [
    'http://localhost:5173'
];

app.use(cors({
    origin: function(origin, callback){
        if(!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        }else{
            callback(new Error('not allowed by cors'));
        }
    },
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/auth', limiter, authMiddleware, authRouter);

connectDB();

app.listen(PORT, ()=>{
    console.log('port running on', PORT);
});