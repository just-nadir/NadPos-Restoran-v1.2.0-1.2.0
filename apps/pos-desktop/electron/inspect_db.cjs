const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../pos.db'); // Dev mode path
console.log("Opening DB:", dbPath);
const db = new Database(dbPath);

try {
    const info = db.pragma('table_info(shifts)');
    console.log("Schema:", info);

    const rows = db.prepare('SELECT * FROM shifts').all();
    console.log("Rows:", rows);
} catch (e) {
    console.error(e);
}
