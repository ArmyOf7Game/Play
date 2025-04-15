import { useState, useEffect } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Sender, Address } from '@ton/core';

export function useTonConnect() {
    const [connected, setConnected] = useState(false);
    const [sender, setSender] = useState<Sender | null>(null);
    const address = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();

    useEffect(() => {
        if (address) {
            setConnected(true);
            setSender({
                send: async ({ to, value, body }: { to: Address; value: bigint; body?: any }) => {
                    try {
                        await tonConnectUI.sendTransaction({
                            validUntil: Math.floor(Date.now() / 1000) + 3600,
                            messages: [
                                {
                                    address: to.toString(),
                                    amount: value.toString(),
                                    payload: body ? body.toBoc().toString('base64') : undefined,
                                },
                            ],
                        });
                    } catch (error) {
                        console.error('Error sending transaction:', error);
                    }
                },
            });
        } else {
            setConnected(false);
            setSender(null);
        }
    }, [address, tonConnectUI]);

    return { sender, connected, address };
}
