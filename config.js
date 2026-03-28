const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // [1] General Settings
    SESSION_ID: process.env.SESSION_ID || "XsYknKhJ#mcKqqNosv_JmmW6-d4m73l7TEd5nzSFtItAQktnxuow", 
    MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://free62:ranu123@cluster0.rxwlzad.mongodb.net/?appName=Cluster0',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '947839383678',
    
    // [2] VEXTER-MD Dashboard Settings (මේ නම් ටික තමයි පැනල් එකෙන් Update වෙන්නේ)
    workMode: process.env.WORK_MODE || 'public',
    statusSeen: process.env.AUTO_STATUS_SEEN || 'true',
    statusReact: process.env.AUTO_STATUS_REACT || 'true',
    autoReply: process.env.AUTO_REPLY || 'false',
    autoVoice: process.env.AUTO_VOICE || 'false',
    autoSticker: process.env.AUTO_STICKER || 'false',
    antiBad: process.env.ANTI_BAD || 'false',
    antiLink: process.env.ANTI_LINK || 'false',
    antiBot: process.env.ANTI_BOT || 'false',
    antiCall: process.env.ANTI_CALL || 'false',
    antiDelete: process.env.ANTI_DELETE || 'false',
    onlineStatus: process.env.ALWAYS_ONLINE || 'true',
    readCommand: process.env.READ_COMMAND || 'true',
    presence: process.env.PRESENCE || 'off',
    aiChat: process.env.AI_CHAT || 'false',

    // [3] UI Settings
    ALIVE_IMG: process.env.ALIVE_IMG || "https://i.ibb.co/ZRXhhYxH/db1c9ed7-6513-49da-8105-f21c73583135.png",
    ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 VEXTER-MD Is Alive Now😍*",
};
