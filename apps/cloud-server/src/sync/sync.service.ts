import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SyncPushDto, SyncPullDto } from './dto/sync-payload.dto';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(private dataSource: DataSource) { }

    async push(payload: SyncPushDto) {
        const { restaurantId, tables } = payload;
        this.logger.log(`Push received. ID: ${restaurantId}, Tables: ${Object.keys(tables).join(',')}`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const [tableName, rows] of Object.entries(tables)) {
                if (!this.isValidTable(tableName)) continue;

                for (const row of rows) {
                    // Sanitize local keys
                    delete row.is_synced;
                    delete row.server_id; // Local tracking ID

                    // Ensure row belongs to the restaurant
                    row.restaurant_id = restaurantId;
                    // Format date fields if necessary (Postgres handles ISO strings well)

                    // Generate UPSERT query
                    const keys = Object.keys(row);
                    const values = Object.values(row);

                    if (keys.length === 0) continue;

                    // Generate UPSERT query
                    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                    const updateSet = keys
                        .map((k) => `${k} = EXCLUDED.${k}`)
                        .join(', ');

                    let conflictTarget = '(id)';
                    if (tableName === 'settings') {
                        conflictTarget = '(restaurant_id, key)';
                    } else if (tableName === 'users') {
                        conflictTarget = '(restaurant_id, pin)'; // Users unique by PIN per restaurant (assuming schema compliance)
                        // Actually schema says UNIQUE(restaurant_id, pin), but PK is id. 
                        // Ideally we upsert by ID if available. 
                        // If ID is UUID, users table HAS id. 
                        // So (id) is fine for users if we sync by UUID.
                    }

                    const query = `
            INSERT INTO "${tableName}" (${keys.join(', ')}) 
            VALUES (${placeholders}) 
            ON CONFLICT ${conflictTarget} DO UPDATE SET ${updateSet};
          `;

                    await queryRunner.query(query, values);
                }
            }

            await queryRunner.commitTransaction();
            return { success: true, message: 'Sync successful' };

        } catch (err) {
            this.logger.error('Sync failed', err);
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async pull(query: SyncPullDto) {
        const { restaurantId, lastSyncTime } = query;
        const result = {};

        const tables = [
            'users',
            'products',
            'categories',
            'tables',
            'halls',
            'sales',
            'sale_items',
            'customers',
            'settings',
            'kitchens',
            'shifts',
            'sms_templates',
            'supplies',
            'supply_items'
        ];

        for (const table of tables) {
            const sql = `
        SELECT * FROM "${table}" 
        WHERE restaurant_id = $1 
        AND updated_at > $2
      `;
            const rows = await this.dataSource.query(sql, [restaurantId, lastSyncTime]);
            if (rows.length > 0) result[table] = rows;
        }

        return { params: query, changes: result };
    }

    private isValidTable(table: string): boolean {
        const allowed = ['users', 'products', 'categories', 'tables', 'halls', 'sales', 'sale_items', 'customers', 'shifts', 'kitchens', 'settings', 'supplies', 'supply_items'];
        return allowed.includes(table);
    }
}
