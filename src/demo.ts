import { FileStore } from './store/FileStore';
import { CacheService } from './services/CacheService';
import { PostService } from './services/PostService';
import { FeedService } from './services/FeedService';
import { EngagementService } from './services/EngagementService';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runDemo() {
    console.log('--- specific Initializing Services ---');
    const store = new FileStore('demo_posts.json');
    store.clear(); // Start fresh

    const cache = new CacheService(5000); // 5s TTL for demo
    const postService = new PostService(store, cache);
    const feedService = new FeedService(store, cache);
    const engagementService = new EngagementService(store, cache);

    console.log('\n--- Creating Posts ---');
    // Create posts with slight delays to ensure different timestamps
    const user1 = 'user_1';
    const user2 = 'user_2';

    for (let i = 1; i <= 5; i++) {
        const p = postService.createPost(user1, `Post ${i} by ${user1}`);
        console.log(`Created: ${p.id} at ${p.createdAt}`);
        await sleep(10);
    }
    for (let i = 6; i <= 10; i++) {
        const p = postService.createPost(user2, `Post ${i} by ${user2}`);
        console.log(`Created: ${p.id} at ${p.createdAt}`);
        await sleep(10);
    }

    console.log('\n>>> Fetching Feed (Page 1) ...');
    const page1 = feedService.getFeed(4);
    console.log(`[Feed] Found ${page1.posts.length} posts.`);
    page1.posts.forEach(p => console.log(`   * "${p.content}" (posted at ${new Date(p.createdAt).toISOString()})`));

    if (page1.nextCursor) {
        console.log('\n>>> Loading more... (Page 2)');
        const page2 = feedService.getFeed(4, page1.nextCursor);
        console.log(`[Feed] Found ${page2.posts.length} more posts.`);
        page2.posts.forEach(p => console.log(`   * "${p.content}"`));
    }

    console.log('\n>>> Simulating User Action: Liking a post...');
    const firstPostId = page1.posts[0].id;
    engagementService.likePost('user_3', firstPostId);
    console.log(`[Action] User 'user_3' liked post ${firstPostId}`);

    const updatedPost = postService.getPost(firstPostId);
    console.log(`[Verify] Post now has ${updatedPost?.likes} likes.`);

    console.log('\n>>> Testing Cache Efficiency...');
    console.log('[Cache] Requesting same post again...');
    const cachedPost = postService.getPost(firstPostId);
    console.log(`[Cache] Retrieved post. Likes: ${cachedPost?.likes} (should match above)`);

    console.log('\n>>> Demo Finished Successfully. <<<');
}

runDemo().catch(console.error);
