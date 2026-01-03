const { db } = require('./database.cjs');
const log = require('electron-log');
const fs = require('fs');
const path = require('path');

const CLOUD_API_URL = 'https://halboldi.uz/api'; // Production URL
const SYNC_INTERVAL_MS = 10000; // 10 seconds

let isSyncing = false;

// Tables to sync
const TABLES = [
    'users',
    'kitchens',
    'halls',
    'tables',
    'categories',
    'products',
    'customers',
    'shifts',
    'sales',
    'sale_items',
    'order_items',
    'debt_history',
    'customer_debts',
    'cancelled_orders',
    'settings'
];

const TABLE_SCHEMAS = {};

function loadSchemas() {
    for (const table of TABLES) {
        try {
            const cols = db.prepare(`PRAGMA table_info("${table}")`).all();
            TABLE_SCHEMAS[table] = new Set(cols.map(c => c.name));
            // console.log(`Loaded schema for ${table}:`, TABLE_SCHEMAS[table]);
        } catch (e) {
            console.error(`Schema load failed for ${table}`, e);
        }
    }
}

let mainWindow = null;

function setMainWindow(win) {
    mainWindow = win;
}

function notifyUI(status, lastSync) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('sync-status', { status, lastSync });
    }
}

function getCredentials() {
    try {
        const idRow = db.prepare("SELECT value FROM settings WHERE key = 'restaurant_id'").get();
        const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'access_key'").get();

        if (idRow && keyRow) {
            return { restaurantId: idRow.value, accessKey: keyRow.value };
        }
    } catch (e) {
        log.error("Credential fetch error:", e);
    }
    return null;
}

async function pushChanges() {
    const creds = getCredentials();
    if (!creds) {
        console.log("⏳ Sync Skipped: No credentials found.");
        return false;
    }
    const { restaurantId, accessKey } = creds;

    const payload = {
        restaurantId,
        tables: {}
    };
    let hasChanges = false;
    let recordCounts = {};

    // 1. Collect Unsynced Data
    for (const table of TABLES) {
        try {
            const rows = db.prepare(`SELECT * FROM ${table} WHERE is_synced = 0 LIMIT 50`).all();
            if (rows.length > 0) {
                // SANITIZATION LOGIC START
                const cleanRows = rows.map(row => {
                    const clean = { ...row };

                    // Fix Waiter ID & Name
                    if (clean.waiter_id === '0' || clean.waiter_id === 0) {
                        clean.waiter_id = null;
                        if (clean.waiter_name === "Noma'lum") clean.waiter_name = null;
                    }
                    if (clean.guest_count === null) clean.guest_count = 0;


                    // Fix Product Stock Precision
                    if (table === 'products' && typeof clean.stock === 'number') {
                        clean.stock = Number(clean.stock.toFixed(4));
                    }

                    // Normalize Dates (updated_at, created_at, deleted_at, date, due_date)
                    const dateFields = ['updated_at', 'created_at', 'deleted_at', 'date', 'due_date'];
                    for (const field of dateFields) {
                        if (clean[field]) {
                            try {
                                const d = new Date(clean[field]);
                                if (!isNaN(d.getTime())) {
                                    clean[field] = d.toISOString();
                                }
                            } catch (e) {
                                // keep original if fail
                            }
                        }
                    }

                    // Clean items_json (for sales, cancelled_orders)
                    if ((table === 'sales' || table === 'cancelled_orders') && clean.items_json) {
                        try {
                            const items = JSON.parse(clean.items_json);
                            let itemsArray = items;
                            let isSplit = false;

                            if (!Array.isArray(items) && items.items && Array.isArray(items.items)) {
                                itemsArray = items.items;
                                isSplit = true;
                            }

                            if (Array.isArray(itemsArray)) {
                                const cleanItems = itemsArray.map(item => ({
                                    ...item,
                                    quantity: typeof item.quantity === 'number' ? Number(item.quantity.toFixed(4)) : item.quantity,
                                    price: typeof item.price === 'number' ? Number(item.price) : item.price
                                }));

                                if (isSplit) {
                                    clean.items_json = JSON.stringify({ ...items, items: cleanItems });
                                } else {
                                    clean.items_json = JSON.stringify(cleanItems);
                                }
                            } else {
                                console.warn(`items_json is not an array for ${table} ${clean.id}`);
                            }
                        } catch (err) {
                            console.warn(`Failed to clean items_json for ${table} ${clean.id}`, err);
                        }
                    }

                    return clean;
                });
                // SANITIZATION LOGIC END

                payload.tables[table] = cleanRows;
                recordCounts[table] = cleanRows.length;
                hasChanges = true;
            }
        } catch (e) {
            log.warn(`Sync: Table ${table} check failed`, e);
        }
    }

    if (!hasChanges) return false;

    console.log("📤 Pushing changes:", recordCounts);

    // DEBUG: Save payload to file
    try {
        const debugPath = path.join(__dirname, 'debug_payload.json');
        fs.writeFileSync(debugPath, JSON.stringify(payload, null, 2));
        console.log(`🐛 Debug payload written to: ${debugPath}`);
    } catch (err) {
        console.error("Failed to write debug payload:", err);
    }

    notifyUI('syncing', null);

    // 2. Send to Cloud
    try {
        const response = await fetch(`${CLOUD_API_URL}/sync/push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-key': accessKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloud error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        if (result.success) {
            console.log("✅ Sync Success. Marking records...");
            markAsSynced(payload.tables);
            notifyUI('online', new Date().toISOString());
            return true;
        }

    } catch (e) {
        log.error("Sync Push Error:", e);
        console.error("Sync Push Error:", e);
        notifyUI('error', null);
        return null;
    }
    return false;
}

function markAsSynced(tablesData) {
    db.transaction(() => {
        for (const [table, rows] of Object.entries(tablesData)) {
            if (table === 'settings') {
                const stmt = db.prepare(`UPDATE settings SET is_synced = 1 WHERE key = ?`);
                for (const row of rows) {
                    stmt.run(row.key);
                }
            } else {
                const stmt = db.prepare(`UPDATE ${table} SET is_synced = 1 WHERE id = ?`);
                for (const row of rows) {
                    if (row.id) stmt.run(row.id);
                }
            }
        }
    })();
}

let heartbeatCounter = 0;

function startSyncService() {
    loadSchemas();
    console.log("🔄 Sync Service Started...");

    setInterval(async () => {
        if (isSyncing) return;
        isSyncing = true;

        const pulled = await pullChanges();
        const pushed = await pushChanges();

        // If any error occurred (returned null), do not set status to online
        if (pulled === null || pushed === null) {
            return;
        }

        // Always notify online if we successfully checked (didn't catch an error)
        // Since error states are handled inside push/pull, if we are here we are "online"
        if (!pushed && !pulled) {
            const creds = getCredentials();
            if (creds) { // Only notify online if we are actually allowed to sync
                notifyUI('online', new Date().toISOString());

                heartbeatCounter++;
                if (heartbeatCounter >= 6) { // Every 1 minute
                    console.log(`💓 Sync Heartbeat: ${new Date().toLocaleTimeString()} (All synced)`);
                    heartbeatCounter = 0;
                }
            }
        }

        isSyncing = false;
    }, SYNC_INTERVAL_MS);
}

async function pullChanges() {
    const creds = getCredentials();
    if (!creds) return false;
    const { restaurantId, accessKey } = creds;

    // 1. Get last pulled time
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'last_pulled_at'").get();
    const lastPulledAt = setting ? setting.value : '1970-01-01T00:00:00.000Z';

    // 2. Fetch from Cloud
    try {
        const queryParams = new URLSearchParams({
            restaurantId: restaurantId,
            lastSyncTime: lastPulledAt
        });

        const response = await fetch(`${CLOUD_API_URL}/sync/pull?${queryParams}`, {
            headers: { 'x-access-key': accessKey }
        });
        if (!response.ok) {
            throw new Error(`Cloud error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const tables = data.changes || {};

        if (Object.keys(tables).length === 0) return; // No updates

        console.log("📥 Pulling changes:", Object.keys(tables));

        // 3. Apply changes to Local DB
        applyChanges(tables);

        // 4. Update timestamp
        const now = new Date().toISOString();
        db.prepare("INSERT INTO settings (key, value) VALUES ('last_pulled_at', ?) ON CONFLICT(key) DO UPDATE SET value = ?").run(now, now);
        console.log("✅ Pull Success. Updated to:", now);
        notifyUI('online', now);
        return true;

    } catch (e) {
        log.error("Sync Pull Error:", e);
        console.error("Sync Pull Error:", e);
        notifyUI('error', null);
        return null;
    }
    return false;
}

function applyChanges(tablesData) {
    db.transaction(() => {
        // TABLES ro'yxati bo'yicha tartib bilan aylanamiz (Foreign Key xatoligini oldini olish uchun)
        for (const table of TABLES) {
            // Agar serverdan kelgan o'zgarishlar ichida shu jadval bo'lmasa, o'tkazib yuboramiz
            if (!tablesData[table]) continue;

            const rows = tablesData[table];

            const validColumns = TABLE_SCHEMAS[table];

            for (const row of rows) {
                // ... (existing code for cleaning record)
                // Ensure is_synced = 1
                const record = { ...row, is_synced: 1 };
                const cleanRecord = {};

                // Filter columns and stringify objects
                for (const [key, val] of Object.entries(record)) {
                    if (validColumns && !validColumns.has(key)) continue; // Skip extra fields

                    if (val && typeof val === 'object') {
                        cleanRecord[key] = JSON.stringify(val); // Convert objects/arrays to string
                    } else {
                        cleanRecord[key] = val;
                    }
                }

                if (Object.keys(cleanRecord).length === 0) continue;

                // SPECIAL LOGIC: ADMIN CONSOLIDATION
                // Agar serverdan kelayotgan user Admin bo'lsa...
                if (table === 'users' && cleanRecord.role === 'admin' && !cleanRecord.deleted_at) {
                    const existingAdmins = db.prepare("SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL").all();
                    for (const admin of existingAdmins) {
                        if (admin.id !== cleanRecord.id) {
                            db.prepare("UPDATE users SET deleted_at = ?, is_synced = 1 WHERE id = ?").run(new Date().toISOString(), admin.id);
                            console.log(`⚠️ Duplicate Admin fix: Marked local admin ${admin.id} as deleted in favor of ${cleanRecord.id}`);
                        }
                    }
                }

                // SPECIAL LOGIC: KITCHEN DEDUPLICATION
                if (table === 'kitchens' && !cleanRecord.deleted_at) {
                    const existingKitchen = db.prepare("SELECT id FROM kitchens WHERE name = ? AND id != ? AND deleted_at IS NULL").get(cleanRecord.name, cleanRecord.id);
                    if (existingKitchen) {
                        console.log(`⚠️ Duplicate Kitchen found: "${cleanRecord.name}". Merging Local (${existingKitchen.id}) -> Synced (${cleanRecord.id})`);

                        // 1. Move references (Products)
                        db.prepare("UPDATE products SET destination = ? WHERE destination = ?").run(cleanRecord.id, existingKitchen.id);
                        db.prepare("UPDATE order_items SET destination = ? WHERE destination = ?").run(cleanRecord.id, existingKitchen.id);

                        // 2. Soft-delete duplicate
                        db.prepare("UPDATE kitchens SET deleted_at = ?, is_synced = 1 WHERE id = ?").run(new Date().toISOString(), existingKitchen.id);
                    }
                }

                // Prepare SQL
                // ... (rest of the insertion logic)
                const columns = Object.keys(cleanRecord); // only valid columns
                const cols = columns.map(k => `"${k}"`).join(',');
                const vals = columns.map(k => `@${k}`).join(',');
                const updateClause = columns.map(k => `"${k}"=@${k}`).join(',');

                if (table === 'settings') {
                    try {
                        db.prepare(`INSERT INTO settings (key, value, updated_at, is_synced) VALUES (@key, @value, @updated_at, 1) 
                            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, is_synced=1`).run(cleanRecord);
                    } catch (err) {
                        console.error(`Failed to sync settings`, err);
                    }
                } else {
                    try {
                        db.prepare(`INSERT INTO "${table}" (${cols}) VALUES (${vals}) 
                            ON CONFLICT(id) DO UPDATE SET ${updateClause}`).run(cleanRecord);
                    } catch (err) {
                        console.error(`Failed to apply sync for ${table} ${row.id}`, err);
                    }
                }
            }

        }
    })();
}

module.exports = { startSyncService, pushChanges, pullChanges, setMainWindow };
