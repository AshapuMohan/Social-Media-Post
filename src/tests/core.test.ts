import { PostService } from '../services/PostService';
import { FeedService } from '../services/FeedService';
import { EngagementService } from '../services/EngagementService';
import { FileStore } from '../store/FileStore';
import { CacheService } from '../services/CacheService';
import fs from 'fs';
import path from 'path';

const TEST_FILE = 'test_posts.json';

describe('Social Media Backend Module', () => {
    let store: FileStore;
    let cache: CacheService;
    let postService: PostService;
    let feedService: FeedService;
    let engagementService: EngagementService;

    beforeAll(() => {
        const filePath = path.join(__dirname, '../../data', TEST_FILE);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    beforeEach(() => {
        store = new FileStore(TEST_FILE);
        cache = new CacheService(); // Default TTL
        postService = new PostService(store, cache);
        feedService = new FeedService(store, cache);
        engagementService = new EngagementService(store, cache);
        store.clear();
        cache.clear();
    });

    afterAll(() => {
        const filePath = path.join(__dirname, '../../data', TEST_FILE);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    test('should create a post', () => {
        const post = postService.createPost('user1', 'Hello World');
        expect(post).toBeDefined();
        expect(post.userId).toBe('user1');
        expect(post.content).toBe('Hello World');
        expect(post.id).toBeDefined();
    });

    test('should retrieve a post by id', () => {
        const post = postService.createPost('user1', 'Hello again');
        const retrieved = postService.getPost(post.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(post.id);
    });

    test('should paginate feed', async () => {
        // Create 5 posts with delay to ensure order
        for (let i = 0; i < 5; i++) {
            postService.createPost('user1', `Post ${i}`);
            await new Promise(r => setTimeout(r, 10));
        }

        const page1 = feedService.getFeed(3);
        expect(page1.posts.length).toBe(3);
        expect(page1.nextCursor).toBeDefined();
        expect(page1.posts[0].content).toBe('Post 4'); // Newest first

        const page2 = feedService.getFeed(3, page1.nextCursor || undefined);
        expect(page2.posts.length).toBe(2);
        expect(page2.posts[0].content).toBe('Post 1');
    });

    test('should cache post retrieval', () => {
        const post = postService.createPost('user1', 'Cache me');

        // First retrieval (cache miss -> set)
        postService.getPost(post.id);

        // Manually inspect cache (white-box) or spy?
        // Let's rely on behavior. 
        // If we modify store directly ( bypassing service ), service should return old value if cached.

        // 1. Get post to cache it
        const p1 = postService.getPost(post.id);

        // 2. Modify in store "backdoor"
        const storedPost = store.getById(post.id);
        if (storedPost) {
            const modified = { ...storedPost, content: "Modified in DB" };
            store.update(modified);
        }

        // 3. Get from service - should still be "Cache me"
        const p2 = postService.getPost(post.id);
        expect(p2?.content).toBe('Cache me');
    });

    test('should invalidate cache on like', () => {
        const post = postService.createPost('user1', 'Like me');
        const p1 = postService.getPost(post.id); // Cache it

        engagementService.likePost('user2', post.id);

        const p2 = postService.getPost(post.id); // Should be fresh
        expect(p2?.likes).toBe(1);
    });
});
