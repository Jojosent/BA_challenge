export type UserRole = 'admin' | 'moderator' | 'user';

export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    rating: number;
    rikonCoins: number;        // Виртуальная валюта
    avatarUrl?: string;
    createdAt: string;
}

export interface AuthUser extends User {
    token: string;
}