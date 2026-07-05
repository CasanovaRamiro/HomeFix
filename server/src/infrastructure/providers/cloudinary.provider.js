import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../lib/envConfig.js';
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});
export const uploadImage = async (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({ folder: 'ofix', resource_type: 'auto' }, (err, result) => {
            if (err || !result)
                reject(err instanceof Error ? err : new Error('Upload failed'));
            else
                resolve(result.secure_url);
        });
        uploadStream.end(file.buffer);
    });
};
export const uploadImages = async (files) => {
    return Promise.all(files.map(uploadImage));
};
export const deleteImage = async (url) => {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (!match)
        return;
    await cloudinary.uploader.destroy(match[1]);
};
