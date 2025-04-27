import axios, { AxiosInstance } from 'axios';

interface CacheEntry {
    url: string;
    timestamp: number;
}

class RobloxAPIClient {
    private client: AxiosInstance;
    private avatarCache: Map<string, CacheEntry> = new Map();
    private pendingRequests: Map<string, Promise<string | null>> = new Map();
    private cacheExpirationTime: number = 60 * 60 * 1000;

    constructor(
        baseURL: string = "http://127.0.0.1:8000/api",
        cacheExpirationTimeMs?: number
    ) {
        this.client = axios.create({
            baseURL,
        });

        if (cacheExpirationTimeMs) {
            this.cacheExpirationTime = cacheExpirationTimeMs;
        }

        // Load cached data from localStorage on init
        this.loadCacheFromStorage();

        // Add request interceptor for logging
        this.client.interceptors.request.use(config => {
            // Log requests
            console.log('Backend Proxy Request:', config.method?.toUpperCase(), config.url, config.params);
            return config;
        }, error => {
            console.error('Backend Proxy Request Error:', error);
            return Promise.reject(error);
        });

        // Add response interceptor for logging
        this.client.interceptors.response.use(response => {
            // Log responses from your backend proxy
            console.log('Backend Proxy Response:', response.status, response.data);
            return response;
        }, error => {
            console.error('Backend Proxy Response Error:', error.response?.status, error.response?.data || error.message);
            return Promise.reject(error);
        });
    }

    /**
     * Returns the endpoint path for the Roblox avatar proxy on your backend.
     * @returns The backend endpoint path.
     */
    getAvatarHeadshotEndpointUrl(): string {
        // The endpoint path on your backend
        return `/roblox-avatar`;
    }

    // save cache to storage
    private saveCacheToStorage(): void {
        try {
            const cacheData: Record<string, CacheEntry> = {};
            this.avatarCache.forEach((entry, key) => {
                cacheData[key] = entry;
            });
            localStorage.setItem('robloxAvatarCache', JSON.stringify(cacheData));
        } catch (error) {
            console.error('Failed to save avatar cache to localStorage:', error);
        }
    }

    // load cache from storage
    private loadCacheFromStorage(): void {
        try {
            const cacheData = localStorage.getItem('robloxAvatarCache');
            if (cacheData) {
                const parsedCache = JSON.parse(cacheData) as Record<string, CacheEntry>;
                Object.entries(parsedCache).forEach(([key, entry]) => {
                    // Only add non-expired entries to the cache
                    if (Date.now() - entry.timestamp < this.cacheExpirationTime) {
                        this.avatarCache.set(key, entry);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load avatar cache from localStorage:', error);
        }
    }

    /**
     * Check if a cached entry is valid (not expired)
     */
    private isCacheValid(entry: CacheEntry): boolean {
        return Date.now() - entry.timestamp < this.cacheExpirationTime;
    }

    /**
     * Fetches avatar headshot image URL for a user via the backend proxy.
     * Handles caching and coalesces multiple requests for the same ID.
     * @param userId The Roblox user ID (as number or string).
     * @returns A promise that resolves with the image URL string, or null if not found/error.
     */
    async getAvatarHeadshotUrl(userId: number | string | null | undefined): Promise<string | null> {
        // Basic check for valid userId before making the request
        if (userId === null || userId === undefined || String(userId).trim() === '' || Number(userId) <= 0) {
            console.warn(`Attempted to fetch avatar for invalid user ID: ${userId}`);
            return null; // Don't make the request for invalid IDs
        }

        // Ensure userId is treated as a string for the API call and cache key
        const userIdString = String(userId);

        // Check if we have a valid cached entry
        const cachedEntry = this.avatarCache.get(userIdString);
        if (cachedEntry && this.isCacheValid(cachedEntry)) {
            console.log(`Using cached avatar URL for user ${userIdString}: ${cachedEntry.url}`);
            return cachedEntry.url;
        }

        // Check if there's a pending request for this user ID
        if (this.pendingRequests.has(userIdString)) {
            console.log(`Reusing in-flight request for user ${userIdString}`);
            // Return the existing promise
            return this.pendingRequests.get(userIdString)!;
        }

        // Create a new request promise and store it
        const requestPromise = this.fetchAvatarUrl(userIdString)
            .finally(() => {
                // Ensure the pending request is removed once it settles (resolves or rejects)
                this.pendingRequests.delete(userIdString);
            });

        this.pendingRequests.set(userIdString, requestPromise);

        return requestPromise;
    }


    /**
     * Actual implementation of fetching avatar URL from backend
     */
    private async fetchAvatarUrl(userIdString: string): Promise<string | null> {
        try {
            // Make the GET request to your backend proxy endpoint
            const response = await this.client.get(this.getAvatarHeadshotEndpointUrl(), {
                params: {
                    userId: userIdString,
                }
            });

            // Check if the request to your backend was successful and data is present
            if (response.status === 200 && response.data && typeof response.data.imageUrl === 'string') {
                const imageUrl = response.data.imageUrl;
                console.log(`Workspaceed imageUrl from backend proxy for user ${userIdString}: ${imageUrl}`);

                // Cache the successful result
                const newEntry: CacheEntry = {
                    url: imageUrl,
                    timestamp: Date.now()
                };
                this.avatarCache.set(userIdString, newEntry);

                // Save updated cache to localStorage
                this.saveCacheToStorage();

                return imageUrl;
            } else {
                // Handle cases where backend returns 200 but data is not as expected
                console.warn('Unexpected successful response structure from backend proxy:', response.data);
                
                return null;
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
             
                console.log(`Avatar not found for user ID ${userIdString} (404 from proxy: ${error.response.data?.error || 'Not Found'}).`);
               
            } else {

                console.error(`Error fetching avatar headshot from backend proxy for user ID ${userIdString}:`,
                    error.response?.status, // Log status if available
                    error.response?.data?.error || error.message); // Log specific error message or general message
            }

            // Return null in all error cases, indicating the URL could not be retrieved
            return null;
        }
    }

    /**
     * Clear the entire cache or entries for a specific user
     * @param userId Optional. If provided, clears cache only for that user.
     */
    clearAvatarCache(userId?: string | number): void {
        if (userId !== undefined) {
            // Clear cache for specific user
            const userIdString = String(userId);
            this.avatarCache.delete(userIdString);
        } else {
            // Clear entire cache
            this.avatarCache.clear();
        }
        // Update localStorage
        this.saveCacheToStorage();
    }
}

// Export a single instance of the client
export const robloxApi = new RobloxAPIClient();

// You can still export the class itself if needed elsewhere
export { RobloxAPIClient };