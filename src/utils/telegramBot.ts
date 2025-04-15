const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = 'https://api.telegram.org';


export async function getUserProfilePhotos(userId: number) {
    try {
        const response = await fetch(
            `${TELEGRAM_API}/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${userId}&limit=1`
        );

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok || !data.result.photos.length) {
            return null;
        }


        const photoSizes = data.result.photos[0];
        const largestPhoto = photoSizes[photoSizes.length - 1];

        return await getFileUrl(largestPhoto.file_id);
    } catch (error) {
        console.error('Error getting user profile photos:', error);
        return null;
    }
}

async function getFileUrl(fileId: string) {
    try {
        const response = await fetch(
            `${TELEGRAM_API}/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
        );

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            return null;
        }

        return `${TELEGRAM_API}/file/bot${BOT_TOKEN}/${data.result.file_path}`;
    } catch (error) {
        console.error('Error getting file URL:', error);
        return null;
    }
}
