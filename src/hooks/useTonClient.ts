import { getHttpEndpoint } from '@orbs-network/ton-access';
import { TonClient } from "@ton/ton";
import { useAsyncInitialize } from './useAsyncInitialize';

const createTonClient = async () => {
    const apiKey = import.meta.env.VITE_TON_API_KEY;

    try {

        return new TonClient({
            endpoint: 'https://toncenter.com/api/v2/jsonRPC',
            apiKey
        });
    } catch (error) {
        console.error('Failed to connect to TonCenter, falling back to Orbs:', error);


        const endpoint = await getHttpEndpoint({
            network: 'mainnet'
        });

        return new TonClient({
            endpoint
        });
    }
};

export function useTonClient() {
    return useAsyncInitialize(createTonClient);
}
