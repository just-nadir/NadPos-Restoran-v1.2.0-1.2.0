export class SyncPushDto {
    restaurantId: string;
    tables: Record<string, any[]>; // e.g. { "users": [...], "products": [...] }
}

export class SyncPullDto {
    restaurantId: string;
    lastSyncTime: string; // ISO Date
}
