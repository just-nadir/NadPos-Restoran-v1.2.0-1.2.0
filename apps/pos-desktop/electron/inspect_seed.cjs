const { app } = require('electron');
const path = require('path');

app.whenReady().then(() => {
    try {
        console.log("Checking DB seeding status...");
        const { initDB, db } = require('./database.cjs');
        initDB();

        const kCount = db.prepare("SELECT count(*) as count FROM kitchens").get().count;
        const smsCount = db.prepare("SELECT count(*) as count FROM sms_templates").get().count;
        const userCount = db.prepare("SELECT count(*) as count FROM users").get().count;

        console.log("VERIFICATION_RESULT");
        console.log(`Kitchens: ${kCount}`);
        console.log(`SMS Templates: ${smsCount}`);
        console.log(`Users: ${userCount}`);

        if (kCount === 0 && smsCount === 0 && userCount === 0) {
            console.log("SUCCESS: Database is empty as requested.");
        } else {
            console.log("FAILURE: Database contains seeded data.");
        }

    } catch (err) {
        console.error("Verification Error:", err);
    } finally {
        app.quit();
    }
});
