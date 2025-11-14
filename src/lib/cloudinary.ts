import { v2 as cloudinary } from 'cloudinary';

export const getCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
        api_key: process.env.CLOUDINARY_API!,
        api_secret: process.env.CLOUDINARY_SECRET!,
    });
    return cloudinary;
};