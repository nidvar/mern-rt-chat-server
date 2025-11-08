import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import authRouter from './routes/auth.route.ts';

import { connectDB } from './lib/db.ts';



const app = express();

const PORT = process.env.PORT || 3000

app.get('/', (req, res)=>{
    res.send('home !!!!');
});

app.use('/auth', authRouter);

connectDB();

app.listen(PORT, ()=>{
    console.log('port running on', PORT);
})