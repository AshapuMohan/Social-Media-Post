import { Post } from '../models/types';
import { FileStore } from '../store/FileStore';
import { CacheService } from './CacheService';

export interface FeedResponse {
    posts: Post[];
    nextCursor: string | null;
}

export class FeedService {
    private store: FileStore;
    private cache: CacheService;

    constructor(store: FileStore, cache: CacheService) {
        this.store = store;
        this.cache = cache;
    }
    public getFeed(limit: number = 10, cursor?: string): FeedResponse {
        const cacheKey = `feed:${limit}:${cursor || 'head'}`;
        const cached = this.cache.get<FeedResponse>(cacheKey);
        if (cached) return cached;

        let posts = this.store.getAll();

        posts.sort((a, b) => {
            if (b.createdAt !== a.createdAt) {
                return b.createdAt - a.createdAt;
            }
            return b.id.localeCompare(a.id);
        });

        if (cursor) {
            const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
            const [cursorTimestampStr, cursorId] = decodedCursor.split(':');
            const cursorTimestamp = parseInt(cursorTimestampStr, 10);

            if (!isNaN(cursorTimestamp) && cursorId) {
                posts = posts.filter(post => {
                    if (post.createdAt < cursorTimestamp) return true;
                    if (post.createdAt === cursorTimestamp && post.id.localeCompare(cursorId) < 0) return true;
                    return false;
                });
            }
        }

        const nextPosts = posts.slice(0, limit);

        let nextCursor: string | null = null;
        if (nextPosts.length > 0 && posts.length > limit) {
            const lastPost = nextPosts[nextPosts.length - 1];
            nextCursor = Buffer.from(`${lastPost.createdAt}:${lastPost.id}`).toString('base64');
        }

        const result = {
            posts: nextPosts,
            nextCursor
        };

        this.cache.set(cacheKey, result, 10000);

        return result;
    }
}
