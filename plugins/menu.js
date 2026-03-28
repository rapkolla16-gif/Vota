const { cmd, commands } = require('../command');
const config = require('../config');

// User ගත්ත Menu එක track කරන්න
global.menuSession = global.menuSession || {};

cmd({
    pattern: "menu",
    react: "🧬",
    filename: __filename
},
async (danuwa, mek, m, { from, reply, sender }) => {
    try {
        let menuText = `*🧬 VEXTER-MD MAIN MENU 🧬*\n\n`;
        menuText += `*1.* Download Commands 📥\n`;
        menuText += `*2.* Group Commands 👥\n`;
        menuText += `*3.* Owner Commands 👑\n\n`;
        menuText += `> Reply with a number.\n_MAIN MENU_`;

        const sent = await danuwa.sendMessage(from, { image: { url: config.ALIVE_IMG }, caption: menuText }, { quoted: mek });
        
        // Session එක save කරනවා
        global.menuSession[sender] = { msgId: sent.key.id, time: Date.now() };

    } catch (e) { reply(`❌ Error: ${e}`); }
});
