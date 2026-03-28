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



};
