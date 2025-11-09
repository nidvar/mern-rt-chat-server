// import environmental requirements
import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 3000;

// import libraries
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';

// import other files
import authRouter from './routes/auth.route.ts';
import { connectDB } from './lib/db.ts';


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


app.use('/auth', authRouter);

app.get('/', (req, res)=>{
    res.json({message: 'home'});
});

connectDB();

app.listen(PORT, ()=>{
    console.log('port running on', PORT);
});