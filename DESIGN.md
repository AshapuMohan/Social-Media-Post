# Design Document - Social Media Backend Module

## Architecture

The project follows a clean, layered architecture to separate concerns and improve maintainability.

### Layers
1. **Models**: Plain TypeScript interfaces (`src/models`) defining the data structures.
2. **Store (Data Access)**: `FileStore` (`src/store`) abstracts persistence. It simulates a database using a JSON file, providing methods like `addPost`, `getPosts`, `updatePost`. It handles simulated concurrent writes via in-memory array manipulation (safe for single-threaded Node.js event loop in this context).
3. **Services (Business Logic)**:
    - `PostService`: Manages post creation and retrieval.
    - `FeedService`: Handles feed aggregation and complex pagination logic.
    - `EngagementService`: Manages likes, comments, and shares.
    - `CacheService`: Provides caching capabilities.
4. **Utils**: Helper functions.

## Key Design Decisions

### 1. Cursor-Based Pagination
- **Problem**: Offset-based pagination (`skip/limit`) is inefficient for large datasets and unstable (items shift if new posts are added).
- **Solution**: Cursor-based pagination using `createdAt` and `id` as the cursor.
- **Implementation**:
    - Sorting by `createdAt DESC`, then `id DESC` (tie-breaker) ensures deterministic order.
    - The `cursor` is a base64 encoded string of `${timestamp}:${id}` of the last item on the current page.
    - This allows generic "seek" operations (`WHERE (createdAt, id) < (cursorTime, cursorId)`) which are index-friendly in real databases.

### 2. Caching Strategy
- **Feed Caching**:
    - **Strategy**: Cache the feed response (Post list + Next Cursor) with a short TTL (e.g., 10 seconds).
    - **Key**: `feed:${limit}:${cursor}`.
    - **Rationale**: Feeds are read-heavy. A short TTL handles high concurrency while ensuring eventual consistency for new posts.
    - **Invalidation**: `PostService.createPost` invalidates the globel feed head (`feed:${limit}:head`). Deep pages expire naturally.

- **Post Detail Caching**:
    - **Strategy**: Cache individual post objects.
    - **Key**: `post:${postId}`.
    - **Rationale**: Fetching post details is frequent.
    - **Invalidation**: `EngagementService` invalidates specific post keys on write actions (like, comment), ensuring the next read fetches fresh data (simulating "Write-Through" or "Cache-Aside with Invalidation").

### 3. Scalability Considerations
- **Separation of Read/Write**: The architecture splits fetching (FeedService) from writing (Post/Engagement Services), allowing them to scale independently.
- **Cache-First**: Design prioritizes cache hits. In a real system, Redis would replace in-memory `CacheService`.
- **Database**: `FileStore` is a mock. It can be replaced by a SQL (Postgres) or NoSQL (DynamoDB/Cassandra) repository implementation without changing the Service layer.

### 4. Concurrency
- `FileStore` reads/writes synchronously to the file but operates on an in-memory array. Node.js is single-threaded, so this is safe from race conditions *within the process*. In a distributed system, database locking or optimistic concurrency would be needed.

## Future Improvements
- **Database**: Replace `FileStore` with a real DB.
- **Authentication**: Add User authentication and context.
- **Distributed Cache**: Move to Redis.
- **Personalized Feed**: Implement "Following" graph to filter the feed.
