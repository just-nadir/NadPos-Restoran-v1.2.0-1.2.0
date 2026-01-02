const { db, notify } = require('../database.cjs');
const crypto = require('crypto');

module.exports = {
  getHalls: () => db.prepare('SELECT * FROM halls WHERE deleted_at IS NULL').all(),

  addHall: (name) => {
    const id = crypto.randomUUID();
    const res = db.prepare('INSERT INTO halls (id, name) VALUES (?, ?)').run(id, name);
    notify('halls', null);
    return res;
  },

  deleteHall: (id) => {
    // Soft Delete tables
    db.prepare("UPDATE tables SET deleted_at = ?, is_synced = 0 WHERE hall_id = ?").run(new Date().toISOString(), id);
    // Soft Delete hall
    const res = db.prepare("UPDATE halls SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);
    notify('halls', null);
    notify('tables', null);
    return res;
  },

  getTables: () => db.prepare('SELECT * FROM tables WHERE deleted_at IS NULL').all(),

  getTablesByHall: (id) => db.prepare('SELECT * FROM tables WHERE hall_id = ? AND deleted_at IS NULL').all(id),

  addTable: (hallId, name) => {
    const id = crypto.randomUUID();
    const res = db.prepare('INSERT INTO tables (id, hall_id, name, is_synced) VALUES (?, ?, ?, 0)').run(id, hallId, name);
    notify('tables', null);
    return res;
  },

  deleteTable: (id) => {
    const res = db.prepare("UPDATE tables SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);
    notify('tables', null);
    return res;
  },

  updateTableGuests: (id, count) => {
    const res = db.prepare("UPDATE tables SET guests = ?, status = 'occupied', start_time = COALESCE(start_time, ?), is_synced = 0 WHERE id = ?")
      .run(count, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), id);
    notify('tables', null);
    return res;
  },

  updateTableStatus: (id, status) => {
    const res = db.prepare('UPDATE tables SET status = ?, is_synced = 0 WHERE id = ?').run(status, id);
    notify('tables', null);
    return res;
  },

  closeTable: (id) => {
    // Buyurtmalarni o'chirish (Soft delete emas, shunchaki yopish - lekin agar log kerak bo'lsa cancel/archive qilish kerak. Hozircha hard delete qolaveradi, chunki order_items savdoga aylanmaydi yopilganda, sales ga o'tadi)
    db.prepare('DELETE FROM order_items WHERE table_id = ?').run(id);
    const res = db.prepare(`UPDATE tables SET status = 'free', guests = 0, start_time = NULL, total_amount = 0, is_synced = 0 WHERE id = ?`).run(id);
    notify('tables', null);
    notify('table-items', id);
    return res;
  }
};