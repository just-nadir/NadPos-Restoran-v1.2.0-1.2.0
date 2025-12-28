const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../pos.db');
const db = new Database(dbPath);

const tables = [
    'halls', 'tables', 'categories', 'products', 'order_items',
    'sales', 'sale_items', 'customers', 'debt_history',
    'customer_debts', 'users', 'kitchens', 'sms_templates',
    'sms_logs', 'cancelled_orders', 'shifts'
];

console.log('--- Database ID Repair ---');

db.transaction(() => {
    for (const table of tables) {
        try {
            // Check if table exists
            const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`).get();
            if (!exists) continue;

            const rows = db.prepare(`SELECT rowid, id FROM ${table} WHERE id IS NULL OR id = ''`).all();
            if (rows.length > 0) {
                console.log(`Fixing ${rows.length} rows in table: ${table}`);
                const updateStmt = db.prepare(`UPDATE ${table} SET id = ? WHERE rowid = ?`);
                for (const row of rows) {
                    const newId = crypto.randomUUID();
                    updateStmt.run(newId, row.rowid);
                }
            } else {
                console.log(`Table ${table} is clean.`);
            }
        } catch (err) {
            console.error(`Error processing table ${table}:`, err.message);
        }
    }
})();

console.log('--- Repair Finished ---');
db.close();
