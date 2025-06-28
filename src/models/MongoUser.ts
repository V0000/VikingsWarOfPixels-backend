export type UserId = string;

export enum UserRole {
    User = 0,
    Moderator = 1,
    Admin = 2
}

export interface BanInfo {
    moderatorID: UserId;
    timeout: number;
    reason: string | null;
}

export interface MongoUser {
    username: string;
    tag: string | null;
    userID: UserId;
    cooldown: number;
    role: UserRole;
    token: string;
    badges: string[];
    points: number;
    banned: BanInfo | null;
}