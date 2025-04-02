import { useState, useCallback } from 'react';
import SlotContract from '../contracts/SlotContract';
import { useTonClient } from './useTonClient';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonConnect } from './useTonConnect';
import { Address, OpenedContract, beginCell, Sender } from '@ton/core';
import { toNano } from '@ton/core';
import { runGetMethod, fetchTransactionByHash, fetchMessagesFromContractToAddress, fetchMessages, processBatch } from '../utils/tonIndexApi';
import { convertAddressesToSquadMembers } from '../utils/addressUtils'; // 
import { HierarchicalSquadMember } from '../types';


export interface TonMessage {
    hash: string;
    source: string;
    destination: string;
    value: string;
    value_extra_currencies?: Record<string, any>;
    fwd_fee?: string;
    ihr_fee?: string;
    created_lt: string;
    created_at: string;
    opcode: string | null;
    ihr_disabled?: boolean;
    bounce?: boolean;
    bounced?: boolean;
    import_fee?: string | null;
    in_msg_tx_hash: string;
    out_msg_tx_hash: string;
    message_content?: {
        hash: string;
        body: string;
        decoded: any;
    };
    init_state?: any;
}

interface CompleteHierarchy {
    captains: HierarchicalSquadMember[];
    totalMembers: number;
    counts?: {
        captains: number;
        caporals: number;
        soldiers: number;
    };
    caporals?: { [captainAddress: string]: string[] };
    soldiers?: { [caporalAddress: string]: string[] };
}


interface SquadMemberCache {
    [ownerAddress: string]: {
        members: string[];
        lastUpdated: number;
        lastTimestamp?: number;
    }
}




let squadMemberCache: SquadMemberCache = {};

interface HierarchicalMember {
    address: string;
    role: 'caporal';
    members: string[];
}

interface OwnerHierarchy {
    captains: {
        [captainAddress: string]: HierarchicalMember[];
    };
    lastUpdated: number;
}

interface HierarchicalCacheType {
    [ownerAddress: string]: OwnerHierarchy;
}


interface HierarchicalCache {
    [ownerAddress: string]: {
        captains: {
            [ownerAddress: string]: HierarchicalSquadMember[];
        };
        caporals?: {
            [captainAddress: string]: HierarchicalSquadMember[];
        };
        soldiers?: {
            [caporalAddress: string]: HierarchicalSquadMember[];
        };
        lastUpdated: number;
    }
}

// @ts-ignore
let hierarchicalCache: HierarchicalCache = {};


try {
    const savedHierarchy = localStorage.getItem('hierarchicalCache');
    if (savedHierarchy) hierarchicalCache = JSON.parse(savedHierarchy);
} catch (e) {
    console.warn('Failed to load hierarchical cache', e);
}




try {
    const savedSquadCache = localStorage.getItem('squadMemberCache');


    if (savedSquadCache) squadMemberCache = JSON.parse(savedSquadCache);

} catch (e) {
    console.warn('Failed to load caches from localStorage', e);
}


const normalizeAddress = (address: string | Address): string => {
    try {
        
        const addressObj = typeof address === 'string'
            ? Address.parse(address)
            : address;

        
        return `${addressObj.workChain}:${addressObj.hash.toString('hex')}`;
    } catch (e) {
        console.error('Error normalizing address:', e);
        return typeof address === 'string' ? address : address.toString();
    }
};





export function useSlotContract() {
    const [completeHierarchyData, setCompleteHierarchyData] = useState<any>(null);

    const client = useTonClient();
    const [val] = useState<null | string>();
    const { sender } = useTonConnect();
    const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

   
    const formatAddressForApi = useCallback((address: string | Address | Sender): string => {
        try {
            if (typeof address === 'string') {
                return Address.parse(address).toString();
            } else if (address instanceof Address) {
                return address.toString();
            } else {
             
                return address.address?.toString() || '';
            }
        } catch (e) {
            console.error("Error formatting address:", e);
            return '';
        }
    }, []);
    const slotContract = useAsyncInitialize(async () => {
        if (!client) return;
        const SmartContract = import.meta.env.VITE_SMART_CONTRACT;
        const contract = SlotContract.fromAddress(
            Address.parse(SmartContract)
        );
        return client.open(contract) as OpenedContract<SlotContract>;
    }, [client]);



    const [joinError, setJoinError] = useState<string | null>(null);

    const joinSlot = async (parentAddress?: string) => {
        if (!slotContract || !sender || !client) return;
        setJoinError(null);

        try {
        
            if (parentAddress) {
                await delay(1000);

  
                const parentHierarchyResult = await getHierarchy(parentAddress);

                if (!parentHierarchyResult || parentHierarchyResult.availableSlots === 0n) {
                    throw new Error("Superior has no available slots, find another higher-up!");
                }
            }


            const formattedContractAddress = formatAddressForApi(slotContract.address);
            const formattedSenderAddress = formatAddressForApi(sender);

            const joinMessages = await fetchMessages({
                source: formattedSenderAddress,
                destination: formattedContractAddress,
                value: "2100000000",  
                limit: 1  
            });

            const hasJoined = joinMessages.messages.length > 0;

            if (hasJoined) {
                throw new Error("Address has already joined the Army of 7. Please use another address!");
            }

            const sendResult = await slotContract.send(
                sender,
                {
                    value: toNano('2.1'),
                    bounce: true
                },
                {
                    $$type: 'Join',
                    parentAddress: parentAddress ? Address.parse(parentAddress) : null
                }
            );
            await sleep(10000);
            return sendResult;
        } catch (error) {
            if (error instanceof Error) {
                setJoinError(error.message);
                throw error;
            }

            const errorMessage = String(error);
            setJoinError(errorMessage);
            throw new Error(errorMessage);
        }
    };



    const decodeRawResponse = (result: any) => {
        if (result?.stack?.items?.[0]?.items) {
            const items = result.stack.items[0].items;

            const ownerAddress = items[0].type === -1 ? items[0].beginParse().loadAddress().toString() : "None";
            const parentAddress = items[1].type === -1 ? items[1].beginParse().loadAddress().toString() : "None";
            const grandparentAddress = items[2].type === -1 ? items[2].beginParse().loadAddress().toString() : "None";
            const greatgrandparentAddress = items[3].type === -1 ? items[3].beginParse().loadAddress().toString() : "None";
            const availableSlots = items[4].toString();

            const decodedData = {
                owner: ownerAddress,
                parent: parentAddress,
                grandparent: grandparentAddress,
                greatgrandparent: greatgrandparentAddress,
                availableSlots: availableSlots
            };


            return decodedData;
        }
        return null;
    };


    const decodeApiV3Response = (result: any) => {
        try {
            if (result?.stack) {
  
                const tuple = result.stack[0];

                if (!tuple || !Array.isArray(tuple)) {
                    return null;
                }

 
                const ownerAddress = tuple[0]?.value || "None";
                const parentAddress = tuple[1]?.value || "None";
                const grandparentAddress = tuple[2]?.value || "None";
                const greatgrandparentAddress = tuple[3]?.value || "None";
                const availableSlots = tuple[4]?.value?.toString() || "0";

                const decodedData = {
                    owner: ownerAddress,
                    parent: parentAddress,
                    grandparent: grandparentAddress,
                    greatgrandparent: greatgrandparentAddress,
                    availableSlots: availableSlots
                };


                return decodedData;
            }
        } catch (e) {
            console.error("Error decoding API v3 response:", e);
        }
        return null;
    };

    const getHierarchy = useCallback(async (address: string) => {
        if (!slotContract) return;

        try {
            const addressObj = Address.parse(address);
  

   
            if (client) {
                try {
                    await delay(1000);
                    const result = await client.runMethod(
                        slotContract.address,
                        'getHierarchy',
                        [{
                            type: 'slice',
                            cell: beginCell().storeAddress(addressObj).endCell()
                        }]
                    );

                    const decodedData = decodeRawResponse(result);
                    if (decodedData) {
                        return {
                            $$type: 'Hierarchy' as const, // Changed from $type to $$type
                            owner: Address.parse(decodedData.owner),
                            parent: decodedData.parent !== "None" ? Address.parse(decodedData.parent) : null,
                            grandparent: decodedData.grandparent !== "None" ? Address.parse(decodedData.grandparent) : null,
                            greatgrandparent: decodedData.greatgrandparent !== "None" ? Address.parse(decodedData.greatgrandparent) : null,
                            availableSlots: BigInt(decodedData.availableSlots)
                        };
                    }
                } catch (e) {
                    console.log("Client method failed, trying direct API:", e);
                }
            }

  
            try {
                const formattedContractAddress = formatAddressForApi(slotContract.address);

                const params = [{
                    type: 'slice',
                    cell: beginCell().storeAddress(addressObj).endCell()
                }];

                const result = await runGetMethod(formattedContractAddress, 'getHierarchy', params);

                let decodedData = decodeRawResponse(result);
                if (!decodedData) {
                    decodedData = decodeApiV3Response(result);
                }

                if (decodedData) {
                    return {
                        $$type: 'Hierarchy' as const, 
                        owner: Address.parse(decodedData.owner),
                        parent: decodedData.parent !== "None" ? Address.parse(decodedData.parent) : null,
                        grandparent: decodedData.grandparent !== "None" ? Address.parse(decodedData.grandparent) : null,
                        greatgrandparent: decodedData.greatgrandparent !== "None" ? Address.parse(decodedData.greatgrandparent) : null,
                        availableSlots: BigInt(decodedData.availableSlots)
                    };
                }
            } catch (error) {
                console.log("Get method error:", error);
            }

            return null;
        } catch (error) {
            console.log("Get hierarchy error:", error);
            return null;
        }
    }, [slotContract, client, formatAddressForApi]);

    const fetchAllPayoutsAndTransactions = useCallback(async (
        ownerAddress: string,
        onNewMessagesFound?: (newMessageCount: number) => Promise<void>
    ) => {
        if (!slotContract) return { messages: [], transactions: [] };

        try {

            const destinationAddress = normalizeAddress(ownerAddress);


            let cachedData = null;
            let mostRecentTimestamp = 0;
            let cachedPayoutMessages: TonMessage[] = [];
            let transactionMap = new Map<string, any>();

            try {
                const cachedString = localStorage.getItem('payoutTransactionsCache');
                if (cachedString) {
                    cachedData = JSON.parse(cachedString);
                    cachedPayoutMessages = cachedData.payoutMessages || [];

      
                    if (cachedPayoutMessages.length > 0) {

                        cachedPayoutMessages.sort((a, b) => {
                            const timeA = parseInt(a.created_at);
                            const timeB = parseInt(b.created_at);
                            return timeB - timeA; 
                        });


                        mostRecentTimestamp = parseInt(cachedPayoutMessages[0].created_at);
                     


                        if (cachedData.payoutTransactions) {
                            cachedData.payoutTransactions.forEach((tx: any) => {
                                transactionMap.set(tx.hash, tx);
                            });
                          
                        }
                    }
                }
            } catch (e) {
                console.warn("Failed to load or parse payout cache:", e);
            }


            const shouldFetchNewData = () => {

                if (!cachedData) return true;


                const now = Date.now();
                const lastCheck = cachedData.lastChecked || 0;
                const fiveMinutes = 5 * 60 * 1000;

                return (now - lastCheck) >= fiveMinutes;
            };

 
            let newPayoutMessages: TonMessage[] = [];

            if (shouldFetchNewData()) {


                if (mostRecentTimestamp > 0) {

                  
                    const startTime = mostRecentTimestamp + 1;

                    newPayoutMessages = await fetchMessagesFromContractToAddress(
                        slotContract.address.toString(),
                        destinationAddress,
                        {
                            limit: 100,
                            maxPages: 4,
                            created_at: startTime
                        }
                    );


                } else {


                    newPayoutMessages = await fetchMessagesFromContractToAddress(
                        slotContract.address.toString(),
                        destinationAddress,
                        {
                            limit: 100,
                            maxPages: 4  
                        }
                    );

                    console.log(`Found ${newPayoutMessages.length} total payout messages`);
                }


                if (newPayoutMessages.length > 0) {
                    console.log("Fetching transactions for new payout messages...");


                    await processBatch(
                        newPayoutMessages,
                        5,
                        async (message: TonMessage) => {
                            const txHash = message.out_msg_tx_hash;

                            if (!txHash) {
                                console.warn(`Message missing out_msg_tx_hash: ${message.hash}`);
                                return null;
                            }

     
                            if (transactionMap.has(txHash)) {
                                return { message, transaction: transactionMap.get(txHash) };
                            }

                            const transaction = await fetchTransactionByHash(txHash);

                            if (transaction) {

                                transactionMap.set(txHash, transaction);

      

                                if (transaction.in_msg?.source) {
                            
                                   
                                }
                            } else {
                                console.warn(`Could not fetch transaction for hash: ${txHash}`);
                            }

                            return { message, transaction };
                        },
                        300 
                    );

    

          
                    if (onNewMessagesFound && newPayoutMessages.length > 0) {

                        await onNewMessagesFound(newPayoutMessages.length);
                    }
                } 
            } 

            let allMessages: TonMessage[] = [...cachedPayoutMessages];

            if (newPayoutMessages.length > 0) {

                const existingMessageHashes = new Set(cachedPayoutMessages.map(msg => msg.hash));


                for (const msg of newPayoutMessages) {
                    if (!existingMessageHashes.has(msg.hash)) {
                        allMessages.push(msg);
                    }
                }


                allMessages.sort((a, b) => {
                    const timeA = parseInt(a.created_at);
                    const timeB = parseInt(b.created_at);
                    return timeB - timeA; 
                });


            }


            const updatedPayoutTransactions = Array.from(transactionMap.values());

            const newCacheData = {
                payoutMessages: allMessages,
                payoutTransactions: updatedPayoutTransactions,
                lastUpdated: allMessages.length > 0 ? allMessages[0].created_at : 0,
                lastChecked: Date.now()  
            };

           
            try {
                localStorage.setItem('payoutTransactionsCache', JSON.stringify(newCacheData));
               
            } catch (e) {
                console.warn("Failed to save payout cache to localStorage:", e);
            }

            return {
                messages: allMessages,
                transactions: updatedPayoutTransactions
            };
        } catch (error) {
            console.error("Error fetching payout messages and transactions:", error);

           
            try {
                const cachedString = localStorage.getItem('payoutTransactionsCache');
                if (cachedString) {
                    const cachedData = JSON.parse(cachedString);

                    return {
                        messages: cachedData.payoutMessages || [],
                        transactions: cachedData.payoutTransactions || []
                    };
                }
            } catch (e) {
                console.warn("Could not fall back to cache:", e);
            }

            return { messages: [], transactions: [] };
        }
    }, [slotContract, normalizeAddress, fetchMessagesFromContractToAddress, fetchTransactionByHash, processBatch]);


 



    const getTotalTopSlots = async (): Promise<number> => {
        if (!slotContract || !client) return 0;
        await delay(1000);
        const result = await client.runMethod(
            slotContract.address,
            'TotalTopSlots',
            []
        );
        return result.stack.readNumber();
    };

    const buildCompleteHierarchy = useCallback(async (ownerAddress: string): Promise<CompleteHierarchy> => {
        if (!slotContract) return { captains: [], totalMembers: 0 };


        const normalizedOwner = normalizeAddress(ownerAddress);

        try {
  
            const { messages: payoutMessages, transactions } = await fetchAllPayoutsAndTransactions(ownerAddress);



            if (!payoutMessages.length) {

                return { captains: [], totalMembers: 0 };
            }


            const transactionMap: Record<string, any> = {};
            for (const tx of transactions) {
                if (tx.hash) {
                    transactionMap[tx.hash] = tx;
                }
            }




            const directParentMap = new Map<string, string>(); 
            const grandparentMap = new Map<string, string>();  
            const greatGrandparentMap = new Map<string, string>(); 
            const hierarchyMap = new Map<string, string[]>(); 

            
      
            const DIRECT_PARENT_BASE = 299600000;
            const GRANDPARENT_BASE = 599600000;
            const GREAT_GRANDPARENT_BASE = 899600000;
            const JOIN_PAYMENT_BASE = 2100000000;


            const VARIANCE = 0.1;


            function isInRange(value: string, baseValue: number, variance: number): boolean {
                const valueNum = Number(value);
                const lowerBound = baseValue * (1 - variance);
                const upperBound = baseValue * (1 + variance);
                return valueNum >= lowerBound && valueNum <= upperBound;
            }

            for (const message of payoutMessages) {
                if (!message.out_msg_tx_hash) continue;

                const tx = transactionMap[message.out_msg_tx_hash];
                if (!tx) continue;

                // Check if this is a join payment with 5% variance
                if (!tx.in_msg?.source || !isInRange(tx.in_msg.value, JOIN_PAYMENT_BASE, VARIANCE)) {
                    continue;
                }

                const recruitAddress = normalizeAddress(tx.in_msg.source);

                if (tx.out_msgs && tx.out_msgs.length > 0) {
                    for (const outMsg of tx.out_msgs) {
                        const destination = normalizeAddress(outMsg.destination);
                        const value = outMsg.value;

                        if (destination === normalizeAddress(slotContract.address.toString())) {
                            continue;
                        }

                        // Check payment values with 5% variance
                        if (isInRange(value, DIRECT_PARENT_BASE, VARIANCE)) {
                            directParentMap.set(recruitAddress, destination);
                        }
                        else if (isInRange(value, GRANDPARENT_BASE, VARIANCE)) {
                            grandparentMap.set(recruitAddress, destination);
                        }
                        else if (isInRange(value, GREAT_GRANDPARENT_BASE, VARIANCE)) {
                            greatGrandparentMap.set(recruitAddress, destination);
                        }
                    }
                }
            }


            const allAddresses = new Set<string>();
            [...directParentMap.keys(), ...directParentMap.values(),
            ...grandparentMap.values(), ...greatGrandparentMap.values()].forEach(addr => {
                allAddresses.add(addr);
                if (!hierarchyMap.has(addr)) {
                    hierarchyMap.set(addr, []);
                }
            });

            for (const [recruit, parent] of directParentMap.entries()) {
                const recruits = hierarchyMap.get(parent) || [];
                if (!recruits.includes(recruit)) {
                    recruits.push(recruit);
                    hierarchyMap.set(parent, recruits);
                }
            }

            for (const [recruit, grandparent] of grandparentMap.entries()) {

                const parent = directParentMap.get(recruit);

                if (parent) {

                    const grandparentChildren = hierarchyMap.get(grandparent) || [];
                    if (!grandparentChildren.includes(parent)) {
                        grandparentChildren.push(parent);
                        hierarchyMap.set(grandparent, grandparentChildren);
                    }
                }
            }


            for (const [recruit, greatGrandparent] of greatGrandparentMap.entries()) {
    
                const parent = directParentMap.get(recruit);

                if (parent) {
       
                    const grandparent = directParentMap.get(parent);

                    if (grandparent) {
      
                        const greatGrandparentChildren = hierarchyMap.get(greatGrandparent) || [];
                        if (!greatGrandparentChildren.includes(grandparent)) {
                            greatGrandparentChildren.push(grandparent);
                            hierarchyMap.set(greatGrandparent, greatGrandparentChildren);
                        }
                    } else {
                        console.warn(`Great-grandparent relationship found for ${recruit}, but no grandparent found`);
                    }
                } else {
                    console.warn(`Great-grandparent relationship found for ${recruit}, but no parent found`);
                }
            }

     
         
            try {
                const cachedString = localStorage.getItem('hierarchicalCache');
                if (cachedString) {
                    hierarchicalCache = JSON.parse(cachedString);
                }
            } catch (e) {
                console.warn("Failed to load hierarchical cache:", e);
            }

            let squadMemberCache: Record<string, { members: string[], lastUpdated: number }> = {};
            try {
                const cachedString = localStorage.getItem('squadMemberCache');
                if (cachedString) {
                    squadMemberCache = JSON.parse(cachedString);
                }
            } catch (e) {
                console.warn("Failed to load squad member cache:", e);
            }

            let totalCaptains = 0;
            let totalCaporals = 0;
            let totalSoldiers = 0;

            if (hierarchyMap.has(normalizedOwner)) {

                const captainAddresses = hierarchyMap.get(normalizedOwner) || [];
                totalCaptains = captainAddresses.length;

                squadMemberCache[normalizedOwner] = {
                    members: captainAddresses,
                    lastUpdated: Date.now()
                };
                let hierarchicalCache: HierarchicalCacheType = {};
                try {
                    const cachedString = localStorage.getItem('hierarchicalCache');
                    if (cachedString) {
                        hierarchicalCache = JSON.parse(cachedString);
                    }
                } catch (e) {
                    console.warn("Failed to load hierarchical cache:", e);
                }

                hierarchicalCache[normalizedOwner] = {
                    captains: {},
                    lastUpdated: Date.now()
                };

                const ownerHierarchy = hierarchicalCache[normalizedOwner];


                const caporalsMap: { [captainAddress: string]: string[] } = {};
                const soldiersMap: { [caporalAddress: string]: string[] } = {};

                for (const captainAddr of captainAddresses) {

                    const caporalAddresses = hierarchyMap.get(captainAddr) || [];
                    totalCaporals += caporalAddresses.length;

                    const captainAddrStr = normalizeAddress(captainAddr);

                    squadMemberCache[captainAddrStr] = {
                        members: caporalAddresses.map(addr => normalizeAddress(addr)),
                        lastUpdated: Date.now()
                    };

                    caporalsMap[captainAddrStr] = caporalAddresses.map(addr => normalizeAddress(addr));

                    ownerHierarchy.captains[captainAddrStr] = [];

                    for (const caporalAddr of caporalAddresses) {

                        const caporalAddrStr = normalizeAddress(caporalAddr);

                        const soldierAddresses = hierarchyMap.get(caporalAddr) || [];
                        totalSoldiers += soldierAddresses.length;

                        squadMemberCache[caporalAddrStr] = {
                            members: soldierAddresses.map(addr => normalizeAddress(addr)),
                            lastUpdated: Date.now()
                        };


                        soldiersMap[caporalAddrStr] = soldierAddresses.map(addr => normalizeAddress(addr));


                        ownerHierarchy.captains[captainAddrStr].push({
                            address: caporalAddrStr,
                            role: 'caporal' as const,
                            members: soldierAddresses.map(addr => normalizeAddress(addr))
                        });
                    }
                }

                try {
                    localStorage.setItem('squadMemberCache', JSON.stringify(squadMemberCache));
                    localStorage.setItem('hierarchicalCache', JSON.stringify(hierarchicalCache));
                   
                } catch (e) {
                    console.warn("Failed to save hierarchy caches:", e);
                }

               
                const captains = captainAddresses.map(captainAddr => ({
                    address: normalizeAddress(captainAddr),
                    role: 'captain' as const,
                    members: (hierarchyMap.get(captainAddr) || []).map(addr => normalizeAddress(addr))
                }));

        

                return {
                    captains,
                    caporals: caporalsMap,
                    soldiers: soldiersMap,
                    totalMembers: totalCaptains + totalCaporals + totalSoldiers,
                    counts: {
                        captains: totalCaptains,
                        caporals: totalCaporals,
                        soldiers: totalSoldiers
                    }
                };
            } else {
                return { captains: [], totalMembers: 0 };
            }
        } catch (error) {
            console.error("Error building complete hierarchy:", error);
            return { captains: [], totalMembers: 0 };
        }
    }, [slotContract, normalizeAddress, fetchAllPayoutsAndTransactions]);


    const fetchPayoutsAndUpdateHierarchy = useCallback(async (ownerAddress: string) => {
       
        return new Promise(async (resolve) => {
            await fetchAllPayoutsAndTransactions(ownerAddress, async (newMessageCount) => {
                console.log(`Rebuilding hierarchy due to ${newMessageCount} new messages found`);

                const newHierarchy = await buildCompleteHierarchy(ownerAddress);

                setCompleteHierarchyData(newHierarchy);

                resolve(newHierarchy);
            });


            setTimeout(() => resolve(completeHierarchyData), 3000);
        });
    }, [fetchAllPayoutsAndTransactions, buildCompleteHierarchy]);

   

    const getSquadMembers = useCallback(async (
        ownerAddress: string,
        forceRefresh = false,
        
    ): Promise<Address[]> => {

        const normalizedAddress = normalizeAddress(ownerAddress);


        if (forceRefresh) {

            await buildCompleteHierarchy(ownerAddress);
        }


        if (!squadMemberCache[normalizedAddress] ||
            Date.now() - squadMemberCache[normalizedAddress].lastUpdated > 5 * 60 * 1000) {

            await buildCompleteHierarchy(ownerAddress);
        }


        if (squadMemberCache[normalizedAddress]) {

            const memberAddresses = squadMemberCache[normalizedAddress].members;


            return memberAddresses.map(addr => {
                try {
                    return Address.parse(addr);
                } catch (e) {
                    console.error(`Error parsing address ${addr}:`, e);
                    return null;
                }
            }).filter(Boolean) as Address[];
        }


        return [];
    }, [normalizeAddress, buildCompleteHierarchy]);

    const getSquadMembersFormatted = useCallback(async (
        ownerAddress: string,
        role: 'captain' | 'caporal' | 'soldier'
    ): Promise<HierarchicalSquadMember[]> => {
        const addresses = await getSquadMembers(ownerAddress);
        return convertAddressesToSquadMembers(addresses, role);
    }, [getSquadMembers]);

    return {
        value: val,
        address: slotContract?.address.toString(),
        joinSlot,
        getHierarchy,
        getSquadMembers,
        joinError,
        getTotalTopSlots,
        buildCompleteHierarchy,
        fetchAllPayoutsAndTransactions,
        getSquadMembersFormatted,
        fetchPayoutsAndUpdateHierarchy,
    };
}
