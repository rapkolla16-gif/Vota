const { cmd, commands } = require('../command');
const config = require('../config');

// Global variable එකක් පාවිච්චි කරමු index.js එකට පේන්න
global.pendingMenu = global.pendingMenu || {};

cmd({
    pattern: "menu",
    alias: ["panel", "list"],
    desc: "Main Menu of the Bot",
    category: "main",
    react: "🧬",
    filename: __filename
},
async (danuwa, mek, m, { from, reply, sender }) => {
    try {
        let menuText = `*🧬 VEXTER-MD MAIN MENU 🧬*\n\n`;
        menuText += `*1.* Download Commands 📥\n`;
        menuText += `*2.* Group Commands 👥\n`;
        menuText += `*3.* Owner Commands 👑\n`;
        menuText += `*4.* Search Commands 🔍\n\n`;
        menuText += `> Reply with a number to see sub-commands.\n`;
        menuText += `_MAIN MENU_`; // මේක අනිවාර්යයි Index logic එකට

        const sentMsg = await danuwa.sendMessage(from, { 
            image: { url: config.ALIVE_IMG }, 
            caption: menuText 
        }, { quoted: mek });

        // එවපු මැසේජ් එකේ ID එක save කරගන්නවා reply එක අඳුරගන්න
        global.pendingMenu[sender] = sentMsg.key.id;

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e}`);
    }
});

// Reply එක Handle කරන Filter එක
cmd({
    on: "text",
    filter: (text, { sender }) => {
        // රිප්ලයි කරන කෙනා කලින් මෙනු එක ගත්ත කෙනාමද බලනවා
        return global.pendingMenu && global.pendingMenu[sender];
    },
    filename: __filename
},
async (danuwa, mek, m, { from, body, sender, reply }) => {
    // රිප්ලයි එකේ තියෙන්නේ අංකයක්ද බලනවා
    if (!global.pendingMenu[sender]) return;
    
    const input = body.trim();
    let subMenu = "";

    if (input === '1') {
        subMenu = "*📥 DOWNLOAD COMMANDS*\n\n.fb\n.yt\n.tt\n.song\n.video";
    } else if (input === '2') {
        subMenu = "*👥 GROUP COMMANDS*\n\n.kick\n.add\n.promote\n.demote\n.tagall";
    } else if (input === '3') {
        subMenu = "*👑 OWNER COMMANDS*\n\n.restart\n.update\n.setvar\n.block";
    } else if (input === '4') {
        subMenu = "*🔍 SEARCH COMMANDS*\n\n.google\n.wiki\n.weather\n.imdb";
    } else {
        return; // අංකයක් නෙවෙයි නම් මුකුත් කරන්නේ නැහැ
    }

    await reply(subMenu);
    
    // එක පාරක් reply කළාම clear කරනවා (නැත්නම් දිගටම අංක වලට reply කරයි)
    delete global.pendingMenu[sender];
});
