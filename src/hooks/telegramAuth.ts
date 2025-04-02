const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;


export async function validateTelegramInitData(initData: string): Promise<boolean> {
    try {

        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');

        if (!hash || !BOT_TOKEN) {

            return false;
        }


        urlParams.delete('hash');


        const sortedParams: [string, string][] = [];
        urlParams.forEach((value, key) => {
            sortedParams.push([key, value]);
        });
        sortedParams.sort((a, b) => a[0].localeCompare(b[0]));

        const dataString = sortedParams
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const encoder = new TextEncoder();
        const botTokenData = encoder.encode(BOT_TOKEN);
        const secretKeyData = await window.crypto.subtle.digest('SHA-256', botTokenData);

        const dataBuffer = encoder.encode(dataString);

        const key = await window.crypto.subtle.importKey(
            'raw',
            secretKeyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await window.crypto.subtle.sign(
            'HMAC',
            key,
            dataBuffer
        );

        const calculatedHash = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return calculatedHash === hash;
    } catch (error) {
        console.error('Error validating Telegram data:', error);
        return false;
    }
}
export function bypassTelegramValidation(): boolean {
    return import.meta.env.DEV && import.meta.env.VITE_BYPASS_TELEGRAM_VALIDATION === 'true';
}

export function parseTelegramInitData(initData: string) {
    try {
        const params = new URLSearchParams(initData);
        const user = JSON.parse(params.get('user') || '{}');

        return {
            user,
            auth_date: Number(params.get('auth_date')),
            hash: params.get('hash'),
            query_id: params.get('query_id'),
            start_param: params.get('start_param')
        };
    } catch (error) {
        console.error('Error parsing Telegram init data:', error);
        return null;
    }
}