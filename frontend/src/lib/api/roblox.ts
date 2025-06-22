import axios, { AxiosInstance } from 'axios';
import { getApiUrl } from '@/config/api';

interface CacheEntry {
    url: string;
    timestamp: number;
}

class RobloxAPIClient {
    private client: AxiosInstance;
    private avatarCache: Map<string, CacheEntry> = new Map();
    private pendingRequests: Map<string, Promise<string | null>> = new Map();
    private cacheExpirationTime: number = 60 * 60 * 1000; // 1 hour default

    constructor(cacheExpirationTimeMs?: number) {
        this.client = axios.create({
            baseURL: `${getApiUrl()}/api`,
        });

        if (cacheExpirationTimeMs) {
            this.cacheExpirationTime = cacheExpirationTimeMs;
        }

        // Initialize cache in browser environment
        if (typeof window !== 'undefined') {
            this.loadCacheFromStorage();
        }

        // Add request interceptor for logging
        this.client.interceptors.request.use(config => {
            console.log('Roblox API Request:', config.method?.toUpperCase(), config.url, config.params);
            return config;
        }, error => {
            console.error('Roblox API Request Error:', error);
            return Promise.reject(error);
        });

        // Add response interceptor for logging
        this.client.interceptors.response.use(response => {
            console.log('Roblox API Response:', response.status, response.data);
            return response;
        }, error => {
            console.error('Roblox API Response Error:', error.response?.status, error.response?.data || error.message);
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

    /**
     * Saves the current avatar cache to localStorage, only if in a browser environment.
     */
    private saveCacheToStorage(): void {
        // Check if localStorage is available (i.e., running in a browser)
        if (typeof window === 'undefined') {
            return; // Do nothing if not in a browser
        }

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

    /**
     * Loads the avatar cache from localStorage, only if in a browser environment.
     */
    private loadCacheFromStorage(): void {
        // Check if localStorage is available (i.e., running in a browser)
        if (typeof window === 'undefined') {
            return; // Do nothing if not in a browser
        }

        try {
            const cacheData = localStorage.getItem('robloxAvatarCache');
            if (cacheData) {
                const parsedCache = JSON.parse(cacheData) as Record<string, CacheEntry>;
                const now = Date.now();
                Object.entries(parsedCache).forEach(([key, entry]) => {
                    // Only add non-expired entries to the in-memory cache
                    if (now - entry.timestamp < this.cacheExpirationTime) {
                        this.avatarCache.set(key, entry);
                    } else {
                        // Optional: Log expired entry removal during load
                        console.log(`Removing expired cache entry for user ${key} during load.`);
                    }
                });
                console.log(`Loaded ${this.avatarCache.size} valid entries from localStorage cache.`);
            }
        } catch (error) {
            console.error('Failed to load or parse avatar cache from localStorage:', error);
            // Optional: Clear potentially corrupted cache item
            try {
                localStorage.removeItem('robloxAvatarCache');
            } catch (removeError) {
                console.error('Failed to remove potentially corrupted avatar cache:', removeError);
            }
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
        if (userId === null || userId === undefined || String(userId).trim() === '' || Number(userId) <= 0) {
            console.warn(`Attempted to fetch avatar for invalid user ID: ${userId}`);
            return null;
        }

        const userIdString = String(userId);

        // Check in-memory cache first
        const cachedEntry = this.avatarCache.get(userIdString);
        if (cachedEntry && this.isCacheValid(cachedEntry)) {
            // console.log(`Using cached avatar URL for user ${userIdString}`); // Less verbose logging
            return cachedEntry.url;
        }

        // Check for pending requests (request coalescing)
        if (this.pendingRequests.has(userIdString)) {
            // console.log(`Reusing in-flight request for user ${userIdString}`); // Less verbose logging
            return this.pendingRequests.get(userIdString)!;
        }

        // Create and store the new request promise
        const requestPromise = this.fetchAvatarUrl(userIdString)
            .finally(() => {
                this.pendingRequests.delete(userIdString); // Remove from pending when done
            });

        this.pendingRequests.set(userIdString, requestPromise);

        return requestPromise;
    }

    /**
     * Actual implementation of fetching avatar URL from the backend proxy.
     * Updates the cache on success.
     */
    private async fetchAvatarUrl(userIdString: string): Promise<string | null> {
        console.log(`Fetching avatar URL for user ${userIdString} from backend proxy...`);
        try {
            const response = await this.client.get(this.getAvatarHeadshotEndpointUrl(), {
                params: { userId: userIdString }
            });

            if (response.status === 200 && response.data) {
                const imageUrl = response.data.imageUrl;
                
                // Handle null imageUrl (avatar not found)
                if (imageUrl === null) {
                    console.log(`Avatar not found for user ID ${userIdString} (null response from proxy)`);
                    return null;
                }
                
                if (typeof imageUrl === 'string') {
                    console.log(`Fetched imageUrl from backend proxy for user ${userIdString}`);

                    // Update in-memory cache
                    const newEntry: CacheEntry = {
                        url: imageUrl,
                        timestamp: Date.now()
                    };
                    this.avatarCache.set(userIdString, newEntry);

                    // Save updated cache to localStorage (will check for browser env inside)
                    this.saveCacheToStorage();

                    return imageUrl;
                } else {
                    console.warn(`Unexpected successful response structure from backend proxy for user ${userIdString}:`, response.data);
                    return null;
                }
            } else {
                console.warn(`Unexpected response status from backend proxy for user ${userIdString}:`, response.status);
                return null;
            }
        } catch (error: any) {
            // Log specific errors based on response status if available
            if (error.response) {
                if (error.response.status === 404) {
                    // Don't log 404 errors as they're expected for invalid/fake user IDs
                    // console.log(`Avatar not found for user ID ${userIdString} (404 from proxy: ${error.response.data?.error || 'Not Found'}).`);
                } else {
                    console.error(`Error fetching avatar from proxy for user ID ${userIdString} - Status ${error.response.status}:`,
                        error.response.data?.error || error.message);
                }
            } else {
                // Network error or other issue without a response object
                console.error(`Network or other error fetching avatar from proxy for user ID ${userIdString}:`, error.message);
            }
            return null; // Return null on any error
        }
    }

    /**
    * Clear the entire cache or entries for a specific user
    * @param userId Optional. If provided, clears cache only for that user.
    */
    clearAvatarCache(userId?: string | number): void {
        if (userId !== undefined) {
            const userIdString = String(userId);
            console.log(`Clearing avatar cache for user ${userIdString}`);
            this.avatarCache.delete(userIdString);
        } else {
            console.log('Clearing entire avatar cache');
            this.avatarCache.clear();
        }
        // Update localStorage (will check for browser env inside)
        this.saveCacheToStorage();
    }
}

// Create and export a singleton instance
export const robloxApi = new RobloxAPIClient();

// Export the class for custom instantiation if needed
export { RobloxAPIClient };
