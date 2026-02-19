import { Post, Comment } from '../models/types';
import { FileStore } from '../store/FileStore';
import { generateId } from '../utils/idGenerator';
import { CacheService } from './CacheService';

export class EngagementService {
    private store: FileStore;
    private cache: CacheService;

    constructor(store: FileStore, cache: CacheService) {
        this.store = store;
        this.cache = cache;
    }

    private invalidatePostCache(postId: string) {
        this.cache.delete(`post:${postId}`);
    }

    public likePost(userId: string, postId: string): Post | undefined {
        const post = this.store.getById(postId);
        if (!post) return undefined;

        if (post.likedBy.includes(userId)) {
            return post;
        }

        post.likedBy.push(userId);
        post.likes = post.likedBy.length;
        this.store.update(post);
        this.invalidatePostCache(postId);
        return post;
    }

    public unlikePost(userId: string, postId: string): Post | undefined {
        const post = this.store.getById(postId);
        if (!post) return undefined;

        const index = post.likedBy.indexOf(userId);
        if (index !== -1) {
            post.likedBy.splice(index, 1);
            post.likes = post.likedBy.length;
            this.store.update(post);
            this.invalidatePostCache(postId);
        }
        return post;
    }

    public commentOnPost(userId: string, postId: string, content: string): Comment | undefined {
        const post = this.store.getById(postId);
        if (!post) return undefined;

        const newComment: Comment = {
            id: generateId(),
            userId,
            content,
            createdAt: Date.now()
        };

        post.comments.push(newComment);
        this.store.update(post);
        this.invalidatePostCache(postId);
        return newComment;
    }

    public sharePost(userId: string, postId: string): Post | undefined {
        const post = this.store.getById(postId);
        if (!post) return undefined;

        post.shares++;
        this.store.update(post);
        this.invalidatePostCache(postId);
        return post;
    }
}
