const { db, notify } = require('../database.cjs');
const crypto = require('crypto');

module.exports = {
    getCategories: () => db.prepare('SELECT * FROM categories').all(),

    addCategory: (name) => {
        const id = crypto.randomUUID();
        const res = db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)').run(id, name);
        notify('products', null);
        notify('categories', null);
        return res;
    },

    updateCategory: (id, name) => {
        const res = db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
        notify('products', null);
        notify('categories', null);
        return res;
    },

    deleteCategory: (id) => {
        // Soft Delete: avval kategoriyaga tegishli barcha mahsulotlarni o'chirish
        db.prepare("UPDATE products SET deleted_at = ?, is_synced = 0 WHERE category_id = ?").run(new Date().toISOString(), id);

        // Keyin kategoriyani o'chirish
        const res = db.prepare("UPDATE categories SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);

        notify('products', null);
        notify('categories', null);
        return res;
    },

    getProducts: () => db.prepare(`
    SELECT p.*, c.name as category_name, k.name as kitchen_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    LEFT JOIN kitchens k ON p.destination = CAST(k.id AS TEXT)
    WHERE p.deleted_at IS NULL
  `).all(),

    addProduct: (p) => {
        const id = crypto.randomUUID();
        const res = db.prepare('INSERT INTO products (id, category_id, name, price, destination, unit_type, is_active, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, 0)').run(id, p.category_id, p.name, p.price, String(p.destination), p.unit_type || 'item', 1);
        notify('products', null);
        return res;
    },

    toggleProductStatus: (id, status) => {
        const res = db.prepare('UPDATE products SET is_active = ?, is_synced = 0 WHERE id = ?').run(status, id);
        notify('products', null);
        return res;
    },

    deleteProduct: (id) => {
        const res = db.prepare("UPDATE products SET deleted_at = ?, is_synced = 0 WHERE id = ?").run(new Date().toISOString(), id);
        notify('products', null);
        return res;
    }
};
