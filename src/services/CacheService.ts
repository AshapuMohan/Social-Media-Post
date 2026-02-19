export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
    value: T;
    expiry: number;
}

export class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number;

    constructor(defaultTTL: number = 60000) { // Default TTL 1 minute
        this.defaultTTL = defaultTTL;
    }

    public get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value as T;
    }

    public set<T>(key: string, value: T, ttl?: number): void {
        const expiry = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, { value, expiry });
    }

    public delete(key: string): void {
        this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
    }
}
