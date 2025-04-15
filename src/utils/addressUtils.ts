import { Address } from '@ton/core';
import { HierarchicalSquadMember } from '../types';



export function normalizeAddress(address: string | Address | null | undefined): string {
    try {
        if (!address) return '';

       
        if (address instanceof Address) {
            return address.toString();
        }

        
        if (typeof address === 'string') {
            return Address.parse(address).toString();
        }

       
        console.error('Unexpected address type:', typeof address, address);
        throw new Error(`Unknown address type: ${address}`);
    } catch (error) {
        console.error('Error normalizing address:', error);
        return typeof address === 'string' ? address : String(address);
    }
}


export function toRawFormat(address: string | Address | null | undefined): string {
    if (!address) return '';

    try {
        const addr = typeof address === 'string' ? Address.parse(address) : address;
        return `${addr.workChain}:${addr.hash.toString('hex')}`;
    } catch (e) {
        console.error('Error converting to raw format:', e);
        return '';
    }
}

export function createCacheKey(address: string | Address): string {
    if (!address) return '';

    try {
        
        const addr = typeof address === 'string' ? Address.parse(address) : address;

        
        const workchain = addr.workChain;
        const hash = addr.hash.toString('hex');

        
        return `${workchain}:${hash}`;
    } catch (e) {
        console.error('Error creating cache key:', e);
        return typeof address === 'string' ? address : String(address);
    }
}

export function addressToSquadMember(
    address: Address,
    role: 'captain' | 'caporal' | 'soldier'
): HierarchicalSquadMember {
    return {
        address: address.toString(),
        role,
        members: []
    };
}


export function convertAddressesToSquadMembers(
    addresses: Address[],
    role: 'captain' | 'caporal' | 'soldier'
): HierarchicalSquadMember[] {
    return addresses.map(addr => addressToSquadMember(addr, role));
}

