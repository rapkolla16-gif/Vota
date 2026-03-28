const { cmd } = require("../command");
const Settings = require("../lib/settings");
const config = require("../config");

// පැනල් එක පෙන්වන කමාන්ඩ් එක
cmd({
    pattern: "settings",
    alias: ["panel", "set"],
    desc: "VEXTER-MD Advanced Setting Panel",
    category: "owner",
    filename: __filename,
},
async (danuwa, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ *Access Denied:* Owner only.");

    const panelMsg = `*「 SETTING PANEL 」*

*🔢 Reply below number*

*\`[1] MODE\`*
*🔸 1.1* ❯❯◦ *PUBLIC* 
*🔸 1.2* ❯❯◦ *PRIVATE* 
*🔸 1.3* ❯❯◦ *GROUPS* 
*🔸 1.4* ❯❯◦ *INBOX* 

*\`[2] AUTO READ STATUS\`*
*🔸 2.1* ❯❯◦ *True*
*🔸 2.2* ❯❯◦ *False*

*\`[3] AUTO REPLY\`*
*🔸 3.1* ❯❯◦ *True*
*🔸 3.2* ❯❯◦ *False*

*\`[4] AUTO VOICE\`*
*🔸 4.1* ❯❯◦ *True*
*🔸 4.2* ❯❯◦ *False*

*\`[5] AUTO STICKER\`*
*🔸 5.1* ❯❯◦ *True*
*🔸 5.2* ❯❯◦ *False*

*\`[6] ANTI BAD\`*
*🔸 6.1* ❯❯◦ *True*
*🔸 6.2* ❯❯◦ *False*

*\`[7] ANTI LINK\`*
*🔸 7.1* ❯❯◦ *True*
*🔸 7.2* ❯❯◦ *False*

*\`[8] ANTI BOT\`*
*🔸 8.1* ❯❯◦ *True*
*🔸 8.2* ❯❯◦ *False*

*\`[9] ALLWAYS ONLINE\`*
*🔸 9.1* ❯❯◦ *Online*
*🔸 9.2* ❯❯◦ *Offline*

*\`[10] READ COMMAND\`*
*🔸 10.1* ❯❯◦ *True*
*🔸 10.2* ❯❯◦ *False*

*\`[11] TYPING & RECORDING\`*
*🔸 11.1* ❯❯◦ *Recording*
*🔸 11.2* ❯❯◦ *Typing*
*🔸 11.3* ❯❯◦ *OFF*

*\`[12] AUTO REACT\`*
*🔸 12.1* ❯❯◦ *True*
*🔸 12.2* ❯❯◦ *False*

*\`[17] ANTI DELETE\`*
*🔸 17.1* ❯❯◦ *Only Inbox*
*🔸 17.2* ❯❯◦ *Only Group*
*🔸 17.3* ❯❯◦ *Both*
*🔸 17.4* ❯❯◦ *False*

*Example:* Reply with *3.2* to change mode.`;

    return reply(panelMsg);
});
