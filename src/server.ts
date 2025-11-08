import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import authRouter from './routes/auth.route.js';



const app = express();

const PORT = process.env.PORT || 3000

app.get('/', (req, res)=>{
    res.send('home !!!!');
});

app.use('/auth', authRouter);



app.listen(PORT, ()=>{
    console.log('port running on', PORT);
})