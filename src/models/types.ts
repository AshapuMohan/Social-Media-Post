export interface Comment {
    id: string;
    userId: string;
    content: string;
    createdAt: number;
}

export interface Post {
    id: string;
    userId: string;
    content: string;
    mediaUrl?: string;
    createdAt: number;
    likes: number;
    likedBy: string[];
    shares: number;
    comments: Comment[];
}

export interface User {
    id: string;
    username: string;
}
