const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "XsYknKhJ#mcKqqNosv_JmmW6-d4m73l7TEd5nzSFtItAQktnxuow", 
WORK_MODE: process.env.WORK_MODE || 'public',
MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://free62:ranu123@cluster0.rxwlzad.mongodb.net/?appName=Cluster0', // මෙතනට URL එක දාන්න
ALIVE_IMG: process.env.ALIVE_IMG || "https://i.ibb.co/ZRXhhYxH/db1c9ed7-6513-49da-8105-f21c73583135.png",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 VERTEX-MD Is Alive Now😍*",
OWNER_NUMBER: process.env.OWNER_NUMBER || '947839383678', // Replace with the owner's phone number
AUTO_STATUS_SEEN: 'true',
AUTO_STATUS_REACT: 'true',
AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
AUTO_REPLY: process.env.AUTO_REPLY || "false",
AUTO_VOICE: process.env.AUTO_VOICE || "false",
AUTO_STICKER: process.env.AUTO_STICKER || "false",
AI_CHAT: process.env.AI_CHAT || "false",
    
    // [4] Protection Settings (Anti-Features)
ANTI_BAD: process.env.ANTI_BAD || "false",
ANTI_LINK: process.env.ANTI_LINK || "false",
ANTI_BOT: process.env.ANTI_BOT || "false",
ANTI_CALL: process.env.ANTI_CALL || "false",
ANTI_DELETE: process.env.ANTI_DELETE || "false", // inbox, group, both, false
    
    // [5] Presence Settings
ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
READ_COMMAND: process.env.READ_COMMAND || "true",
PRESENCE: process.env.PRESENCE || "off", // recording, typing, off



};
