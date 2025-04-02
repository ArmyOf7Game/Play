

const TON_API_V3_BASE = 'https://toncenter.com/api/v3';
const API_KEY = import.meta.env.VITE_TON_API_KEY;

const requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;


async function processRequestQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (requestQueue.length > 0) {
        const request = requestQueue.shift();
        if (request) {
            await request();

            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    isProcessingQueue = false;
}


export async function callTonApiV3(
    endpoint: string,
    params: any = {},
    method: 'GET' | 'POST' = 'GET'
) {
    return new Promise<any>((resolve, reject) => {

        requestQueue.push(async () => {
            const headers: HeadersInit = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            if (API_KEY) {
                headers['X-API-Key'] = API_KEY;
            }

            let url = `${TON_API_V3_BASE}${endpoint}`;
            let options: RequestInit = { method, headers };

            if (method === 'GET' && Object.keys(params).length > 0) {
                const queryParams = new URLSearchParams();

                Object.entries(params).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(v => queryParams.append(key, String(v)));
                    } else {
                        queryParams.append(key, String(value));
                    }
                });

                url += `?${queryParams.toString()}`;
            } else if (method === 'POST' && Object.keys(params).length > 0) {
                options.body = JSON.stringify(params);
            }

            try {
     
                const response = await fetch(url, options);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`API error (${response.status}):`, errorText);
                    reject(new Error(`API request failed with status ${response.status}: ${errorText}`));
                    return;
                }

                const responseJson = await response.json();
                resolve(responseJson);
            } catch (error) {
                console.error('Error calling TON API v3:', error);
                reject(error);
            }
        });


        processRequestQueue();
    });
}



export async function getTransactions(params: {
    account?: string[];
    hash?: string;
    limit?: number;
    lt?: string;
    start_lt?: string;
    end_lt?: string;
    offset?: number;
    sort?: 'asc' | 'desc';
    [key: string]: any;
}) {

    const requestParams = {
        offset: 0,
        sort: 'desc' as const,
        ...params
    };

    const result = await callTonApiV3('/transactions', requestParams);


    return result.transactions || [];
}


export async function runGetMethod(address: string, method: string, stack: any[] = []) {
    return callTonApiV3('/runGetMethod', {
        address,
        method,
        stack
    }, 'POST');
}

const withRateLimitRetry = async <T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        factor?: number;
    } = {}
): Promise<T> => {
    const {
        maxRetries = 5,
        initialDelay = 1000,
        maxDelay = 15000,
        factor = 2
    } = options;

    let delay = initialDelay;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {

            const isRateLimit =
                error.message?.includes('429') ||
                error.status === 429 ||
                error.message?.toLowerCase().includes('rate limit');


            if (attempt === maxRetries - 1 || !isRateLimit) {
                throw error;
            }

            const jitter = Math.random() * 0.3 + 0.85;
            delay = Math.min(delay * factor * jitter, maxDelay);

            


            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Max retries exceeded');
};


export async function fetchTransactionByHash(hash: string) {
    return withRateLimitRetry(async () => {
    try {
        const params = {
            hash: hash,
            limit: 1
        };

        const result = await getTransactions(params);
        if (result && result.length > 0) {
            return result[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching transaction by hash ${hash}:`, error);
        return null;
        }
        }, {
            maxRetries: 5,
            initialDelay: 1500  
        });
}


export async function fetchMessages(params: {
    source?: string;
    destination?: string;
    value?: string;
    limit?: number;
    offset?: number;
    sort?: 'asc' | 'desc';
    start_lt?: string;
    end_lt?: string;
    start_utime?: number;
    created_at?: number;
    maxPages?: number;
}) {
    return withRateLimitRetry(async () => {
    try {

        const { maxPages = 4, ...apiParams } = params;
        const initialLimit = apiParams.limit || 100;
        const initialOffset = apiParams.offset || 0;


        let allMessages: any[] = [];
        let currentOffset = initialOffset;
        let hasMoreMessages = true;
        let pageCount = 0;


        while (hasMoreMessages && pageCount < maxPages) {
            pageCount++;

            const requestParams = {
                offset: currentOffset,
                sort: 'desc' as const,
                limit: initialLimit,
                ...apiParams
            };

            const queryParams = new URLSearchParams();
            Object.entries(requestParams).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, String(value));
                }
            });

            if (API_KEY) {
                queryParams.append('api_key', API_KEY);
            }

            const url = `${TON_API_V3_BASE}/messages?${queryParams.toString()}`;
   

            const headers: HeadersInit = {
                'Accept': 'application/json'
            };

            if (API_KEY) {
                headers['X-API-Key'] = API_KEY;
            }

       
            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const pageMessages = data.messages || [];

           

            allMessages = [...allMessages, ...pageMessages];

            hasMoreMessages = pageMessages.length >= initialLimit;

            if (hasMoreMessages) {

                currentOffset += initialLimit;

                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        if (hasMoreMessages && pageCount >= maxPages) {
            console.warn(`Reached maximum page count (${maxPages}). Some messages might not be included.`);
        } 

        return {
            messages: allMessages,
            hasMore: hasMoreMessages
        };
    } catch (error) {
        console.error('Error fetching messages:', error);
        return { messages: [], hasMore: false };
    }
    }, {
        maxRetries: 5,
        initialDelay: 1500  
    });
}

export async function processBatch<T, R>(
    items: T[],
    batchSize: number,
    processFunction: (item: T) => Promise<R | null>,
    delayMs: number = 1000
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
    

        const batchResults = await Promise.all(
            batch.map(item => processFunction(item))
        );

        results.push(...batchResults.filter(Boolean) as R[]);

        if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}


export async function fetchMessagesFromContractToAddress(
    contractAddress: string,
    destinationAddress: string,
    options: {
        value?: string;
        limit?: number;
        offset?: number;
        created_at?: number
        maxPages?: number; 
    } = {}
) {
    return withRateLimitRetry(async () => { 
    const {  limit = 20, offset = 0, maxPages = 20, created_at } = options;


    let allMessages: any[] = [];
    let currentOffset = offset;
    let hasMore = true;
    let pageCount = 0;




    while (hasMore && pageCount < maxPages) {
        pageCount++;
 

        const params: any = {
            source: contractAddress,
            destination: destinationAddress,
            limit,
            offset: currentOffset,
            sort: 'desc'
        };


        if (created_at) {
            params.start_utime = created_at;  
           
        }
        
        try {
            const result = await fetchMessages(params);
            const pageMessages = result.messages;

  


            allMessages = [...allMessages, ...pageMessages];

    
            hasMore = result.hasMore;

       
            if (hasMore) {
                currentOffset += limit;


                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (error) {
            console.error(`Error fetching message page ${pageCount}:`, error);

            hasMore = false;
        }
    }


    if (hasMore && pageCount >= maxPages) {
        console.warn(`Reached maximum page count (${maxPages}). There may be more messages not fetched.`);
    }


    return allMessages;
    }, {
        maxRetries: 5,
        initialDelay: 1000
    });
}