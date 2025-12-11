import cloudinary from "cloudinary";
import fs from "fs";

cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});

export default async function uploadToCloud(localPath) {
    if (!localPath) return null;

    try {
        const result = await cloudinary.v2.uploader.upload(localPath, {
            folder: "infra-lab/repairs"
        });

        fs.unlinkSync(localPath); // xoá file local
        return result.secure_url;

    } catch (err) {
        console.error("Cloudinary upload error:", err);
        return null;
    }
}
