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
import { limiter } from '../src/utils/utils';

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
app.use(express.json());

app.use('/auth', limiter, authRouter);

app.get('/', (req, res)=>{
    res.json({message: 'home'});
});

connectDB();

app.listen(PORT, ()=>{
    console.log('port running on', PORT);
});