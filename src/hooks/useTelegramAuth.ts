import { useState, useEffect } from 'react';
import { validateTelegramInitData, bypassTelegramValidation } from './telegramAuth';

declare global {
    interface Window {
        Telegram: {
            WebApp: {
                initData: string;
                initDataUnsafe: {
                    user?: {
                        id: number;
                        first_name: string;
                        last_name?: string;
                        username?: string;
                        language_code?: string;
                        photo_url?: string;
                    };
                    auth_date: number;
                    hash: string;
                    query_id?: string;
                    start_param?: string;
                };
                ready: () => void;
                expand: () => void;
                close: () => void;

                utils: {
                    readTextFromClipboard: () => Promise<string | null>;
                    openLink: {
                        tryInstantView: (url: string, options?: any) => boolean;
                    };
                };

                onEvent: (eventType: string, eventHandler: (event: any) => void) => void;
                offEvent: (eventType: string, eventHandler: (event: any) => void) => void;
                HapticFeedback?: {
                    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
                    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
                    selectionChanged: () => void;
                };
            };
        };
    }
}


interface TelegramUser {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
}

export function useTelegramAuth() {

    const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isTelegram, setIsTelegram] = useState<boolean>(false);

    useEffect(() => {
        const initTelegram = async () => {
            try {

                const telegramAvailable = Boolean(window.Telegram?.WebApp);
                setIsTelegram(telegramAvailable);

                if (!telegramAvailable) {
                    setIsInitialized(true);
                    return;
                }


                window.Telegram.WebApp.ready();


                if (bypassTelegramValidation()) {

                    handleTelegramInitialization();
                    return;
                }


                const initData = window.Telegram.WebApp.initData;
                const isValid = await validateTelegramInitData(initData);

                if (!isValid) {
                    setError('Invalid Telegram WebApp data');
                    setIsInitialized(true);
                    return;
                }

                handleTelegramInitialization();
            } catch (err) {
                setError(`Failed to initialize Telegram: ${err instanceof Error ? err.message : String(err)}`);
                setIsInitialized(true);
            }
        };

        const handleTelegramInitialization = () => {
            try {

                const userData = window.Telegram.WebApp.initDataUnsafe.user;

                if (userData) {
                    setTelegramUser({
                        id: userData.id,
                        firstName: userData.first_name,
                        lastName: userData.last_name,
                        username: userData.username,
                        photoUrl: userData.photo_url
                    });
                }


                window.Telegram.WebApp.expand();

                setIsInitialized(true);
            } catch (err) {
                setError(`Error processing Telegram data: ${err instanceof Error ? err.message : String(err)}`);
                setIsInitialized(true);
            }
        };

        initTelegram();
    }, []);

    return {
        telegramUser,
        isInitialized,
        error,
        isTelegram
    };
}