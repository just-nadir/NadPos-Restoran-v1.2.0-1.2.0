const { db, notify } = require('../database.cjs');
const log = require('electron-log');
// const telegramController = require('./telegramController.cjs');
const crypto = require('crypto');

module.exports = {
    // Smenani ochish
    openShift: (cashierName, startCash) => {
        try {
            // Avval ochiq smena borligini tekshirish
            const activeShift = db.prepare("SELECT * FROM shifts WHERE status = 'open'").get();
            if (activeShift) {
                throw new Error("Smena allaqachon ochiq!");
            }

            const startTime = new Date().toISOString();
            const id = crypto.randomUUID();
            const stmt = db.prepare("INSERT INTO shifts (id, start_time, start_cash, status, cashier_name) VALUES (?, ?, ?, 'open', ?)");
            const info = stmt.run(id, startTime, startCash || 0, cashierName);

            log.info(`Smena ochildi: ID ${id}, Kassir: ${cashierName}`);
            notify('shift-status', 'open');
            return { success: true, shiftId: id };
        } catch (err) {
            log.error("openShift xatosi:", err);
            throw err;
        }
    },

    // Smenani yopish (Z-Report)
    closeShift: async ({ endCash, endCard }) => {
        try {
            const activeShift = db.prepare("SELECT * FROM shifts WHERE status = 'open'").get();
            if (!activeShift) {
                throw new Error("Ochiq smena topilmadi!");
            }

            // Faol stollar borligini tekshirish
            const activeTables = db.prepare("SELECT COUNT(*) as count FROM tables WHERE status != 'free'").get();
            if (activeTables.count > 0) {
                throw new Error("Diqqat! Barcha stollar yopilmagan. Smenani yopishdan oldin iltimos, faol stollarni hisob-kitob qiling.");
            }

            const endTime = new Date().toISOString();
            const shiftId = activeShift.id;

            // Smena davomidagi savdolarni hisoblash (TIZIM)
            const salesStats = db.prepare(`
                SELECT 
                    SUM(total_amount) as total,
                    SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash,
                    SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) as card,
                    SUM(CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END) as transfer
                FROM sales 
                WHERE shift_id = ?
            `).get(shiftId);

            const totalSales = salesStats.total || 0;
            const totalCash = salesStats.cash || 0;
            const totalCard = salesStats.card || 0;
            const totalTransfer = salesStats.transfer || 0;

            // TAFOVUTLARNI HISOBLASH
            // Naqd pul: (Boshlang'ich + Savdo Naqd) vs (Haqiqiy Kassadagi)
            const expectedCash = (activeShift.start_cash || 0) + totalCash;
            const diffCash = (endCash || 0) - expectedCash;

            // Terminal: (Savdo Karta) vs (Haqiqiy Terminal)
            // Transfer tizimda avtomatik to'g'ri deb olinadi
            const expectedCard = totalCard;
            const diffCard = (endCard || 0) - expectedCard;

            // Smenani yopish
            db.prepare(`
                UPDATE shifts 
                SET end_time = ?, 
                    end_cash = ?, 
                    declared_cash = ?, -- Kassadagi haqiqiy pul
                    declared_card = ?, -- Terminaldagi summa
                    difference_cash = ?, 
                    difference_card = ?,
                    status = 'closed', 
                    total_sales = ?, total_cash = ?, total_card = ?, total_transfer = ?
                WHERE id = ?
            `).run(
                endTime,
                endCash || 0, // Bu end_cash eski logika bo'yicha "qaytarilayotgan summa" bo'lishi mumkin, lekin bu yerda declared sifatida ishlatamiz
                endCash || 0,
                endCard || 0,
                diffCash,
                diffCard,
                totalSales, totalCash, totalCard, totalTransfer, shiftId
            );

            log.info(`Smena yopildi: ID ${shiftId}`);

            // Telegramga hisobot yuborish (Removed)
            /*
            try {
                await telegramController.sendShiftReport(shiftId);
            } catch (tgErr) {
                log.warn("Telegram Z-Report xatosi:", tgErr.message);
            }
            */

            // Printerga chiqarish (Z-Report)
            try {
                const printerService = require('../services/printerService.cjs');
                await printerService.printZReport({
                    shiftId: shiftId,
                    startTime: activeShift.start_time,
                    endTime: endTime,
                    cashierName: activeShift.cashier_name,

                    systemCash: totalCash,
                    startCash: activeShift.start_cash || 0,
                    expectedCash: expectedCash,
                    actualCash: endCash || 0,
                    diffCash: diffCash,

                    systemCard: totalCard,
                    actualCard: endCard || 0,
                    diffCard: diffCard,

                    systemTransfer: totalTransfer,
                    totalSales: totalSales
                });
            } catch (printErr) {
                log.warn("Printer Z-Report xatosi:", printErr.message);
            }

            notify('shift-status', 'closed');
            return { success: true };
        } catch (err) {
            log.error("closeShift xatosi:", err);
            throw err;
        }
    },

    // Smena holatini olish
    getShiftStatus: () => {
        const activeShift = db.prepare("SELECT * FROM shifts WHERE status = 'open'").get();
        return activeShift || null;
    }
};
