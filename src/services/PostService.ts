import { Post } from '../models/types';
import { FileStore } from '../store/FileStore';
import { generateId } from '../utils/idGenerator';
import { CacheService } from './CacheService';

export class PostService {
    private store: FileStore;
    private cache: CacheService;

    constructor(store: FileStore, cache: CacheService) {
        this.store = store;
        this.cache = cache;
    }

    public createPost(userId: string, content: string, mediaUrl?: string): Post {
        const newPost: Post = {
            id: generateId(),
            userId,
            content,
            mediaUrl,
            createdAt: Date.now(),
            likes: 0,
            likedBy: [],
            shares: 0,
            comments: []
        };
        this.store.add(newPost);
        this.cache.delete('feed:global');
        return newPost;
    }

    public getPost(id: string): Post | undefined {
        const cacheKey = `post:${id}`;
        const cached = this.cache.get<Post>(cacheKey);
        if (cached) return cached;

        const post = this.store.getById(id);
        if (post) {
            this.cache.set(cacheKey, post);
        }
        return post;
    }
}
