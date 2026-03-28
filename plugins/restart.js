const config = require('../config');
const { cmd, commands } = require('../command');
const { sleep } = require('../lib/functions');
const { exec } = require("child_process");

cmd({
    pattern: "restart",
    react: '♻️',
    desc: "Restart the bot",
    category: "owner", // Category එක owner කළා
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, isOwner }) => {
    try {
        // --- 🧬 RELIABLE OWNER CHECK ---
        // index.js එකෙන් එන isOwner variable එක පාවිච්චි කිරීම වඩාත් සුදුසුයි
        // නැත්නම් කෙළින්ම config එකේ නම්බර් එකත් එක්ක මෙහෙම චෙක් කරන්න පුළුවන්:
        
        const ownerNumber = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
        const senderNumber = sender.split('@')[0].replace(/[^0-9]/g, '');

        if (senderNumber !== ownerNumber) {
            return reply("❌ *This command is only for my Owner (Dexter)!*");
        }

        await reply("♻️ *VEXTER-MD IS RESTARTING...*");
        await sleep(1500);

        // PM2 පාවිච්චි කරනවා නම් මේක වැඩ කරනවා. 
        // Koyeb/Heroku වගේ නම් කෙළින්ම process එක kill කරලා restart කරන්න පුළුවන්.
        exec("pm2 restart all || npm start", (err, stdout, stderr) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                return;
            }
            console.log(`Stdout: ${stdout}`);
        });

    } catch (e) {
        console.error("Restart error:", e);
        reply("❌ Failed to restart:\n" + e.message);
    }
});
