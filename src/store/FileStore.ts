import fs from 'fs';
import path from 'path';
import { Post } from '../models/types';

export class FileStore {
    private readonly filePath: string;
    private posts: Post[] = [];

    constructor(fileName: string = 'posts.json') {
        this.filePath = path.join(__dirname, '../../data', fileName);
        this.ensureDirectoryExists();
        this.load();
    }

    private ensureDirectoryExists() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private load() {
        if (!fs.existsSync(this.filePath)) {
            return;
        }
        try {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            this.posts = JSON.parse(data);
        } catch (err) {
            console.warn(`[FileStore] Failed to load data from ${this.filePath}. Starting empty.`, err);
            this.posts = [];
        }
    }

    private save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.posts, null, 2));
        } catch (err) {
            console.error(`[FileStore] Failed to save data to ${this.filePath}`, err);
        }
    }

    public getAll(): Post[] {
        // Return a shallow copy to prevent external mutation affecting the store without calling update
        return [...this.posts];
    }

    public getById(id: string): Post | undefined {
        return this.posts.find(p => p.id === id);
    }

    public add(post: Post): void {
        this.posts.push(post);
        this.save();
    }

    public update(updatedPost: Post): void {
        const index = this.posts.findIndex(p => p.id === updatedPost.id);
        if (index !== -1) {
            this.posts[index] = updatedPost;
            this.save();
        }
    }

    public clear(): void {
        this.posts = [];
        if (fs.existsSync(this.filePath)) {
            try {
                fs.unlinkSync(this.filePath);
            } catch (e) {
                // ignore
            }
        }
    }
}
