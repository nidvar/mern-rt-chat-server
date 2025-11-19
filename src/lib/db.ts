import mongoose from 'mongoose';

export const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('Connected to jarro_mongodb cluster jarro')
    }catch(error){
        console.log(error);
    }
};