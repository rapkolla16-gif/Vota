const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    AnyMessageContent,
    prepareWAMessageMedia,
    areJidsSameUser,
    downloadContentFromMessage,
    MessageRetryMap,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    generateMessageID,
    makeInMemoryStore,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const express = require('express');
const axios = require('axios');
const path = require('path');
const qrcode = require('qrcode-terminal');

const config = require('./config');
const { sms, downloadMediaMessage } = require('./lib/msg');
const {
    getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson
} = require('./lib/functions');
const { File } = require('megajs');
const { commands, replyHandlers } = require('./command');

const app = express();
const port = process.env.PORT || 8000;

const prefix = '.';
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

async function ensureSessionFile() {
    if (!fs.existsSync(credsPath)) {
        if (!config.SESSION_ID) {
            console.error('❌ SESSION_ID env variable is missing. Cannot restore session.');
            process.exit(1);
        }
        console.log("🔄 creds.json not found. Downloading session from MEGA...");
        const sessdata = config.SESSION_ID;
        const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
        filer.download((err, data) => {
            if (err) {
                console.error("❌ Failed to download session file from MEGA:", err);
                process.exit(1);
            }
            fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });
            fs.writeFileSync(credsPath, data);
            console.log("✅ Session downloaded and saved. Restarting bot...");
            setTimeout(() => { connectToWA(); }, 2000);
        });
    } else {
        setTimeout(() => { connectToWA(); }, 1000);
    }
}

const antiDeletePlugin = require('./plugins/antidelete.js');
global.pluginHooks = global.pluginHooks || [];
global.pluginHooks.push(antiDeletePlugin);

async function connectToWA() {
    console.log("Connecting VEXTER-MD 🧬...");
    
    try {
        const Settings = require('./lib/settings');
        const savedSettings = await Settings.findOne({}); 
        if (savedSettings) {
            config.workMode = savedSettings.workMode || config.workMode;
            config.statusSeen = savedSettings.statusSeen || config.statusSeen;
            config.statusReact = savedSettings.statusReact || config.statusReact;
            console.log(`✅ Settings Synced From DB`);
        }
    } catch (e) {
        console.log("❌ DB Settings Load Error:", e);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '/auth_info_baileys/'));
    const { version } = await fetchLatestBaileysVersion();

    const danuwa = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Firefox"),
        auth: state,
        version,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
    });

    danuwa.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) setTimeout(() => connectToWA(), 5000);
        } else if (connection === 'open') {
            console.log('✅ VEXTER-MD connected to WhatsApp');
            const up = `VEXTER-MD connected ✅\n\nPREFIX: ${prefix}`;
            await danuwa.sendMessage("94783462955@s.whatsapp.net", {
                image: { url: config.ALIVE_IMG },
                caption: up
            });
            fs.readdirSync("./plugins/").forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() === ".js") {
                    require(`./plugins/${plugin}`);
                }
            });
        }
    });

    danuwa.ev.on('messages.upsert', async ({ messages }) => {
        const mek = messages[0];
        if (!mek || !mek.message) return;

        const from = mek.key.remoteJid;
        // --- මෙන්න මේ ටික තමයි අලුතින්ම දාන්න ඕනෙ ---
        if (config.presence && config.presence !== 'off') {
            await danuwa.sendPresenceUpdate(config.presence, from);
        }
        // ------------------------------------------

        
        
        const type = getContentType(mek.message);
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (mek.message[type]?.caption || '');
        const sender = mek.key.fromMe ? danuwa.user.id : (mek.key.participant || mek.key.remoteJid);
        const senderNumber = sender.split('@')[0].replace(/[^0-9]/g, '');
        const isOwner = config.OWNER_NUMBER.includes(senderNumber) || mek.key.fromMe;
        const isCmd = body.startsWith(prefix);
        const reply = (text) => danuwa.sendMessage(from, { text }, { quoted: mek });

        // --- 1. Dashboard Logic (All 40 Cases) ---
        if (!isCmd && isOwner && body) {
            let update = {};
            let msgDesc = "";
            const input = body.trim();
            const Settings = require('./lib/settings');

            switch(input) {
                // Work Mode
                case "1.1": update.workMode = "public"; msgDesc = "Work Mode: PUBLIC"; break;
                case "1.2": update.workMode = "private"; msgDesc = "Work Mode: PRIVATE"; break;
                case "1.3": update.workMode = "groups"; msgDesc = "Work Mode: GROUPS"; break;
                case "1.4": update.workMode = "inbox"; msgDesc = "Work Mode: INBOX"; break;
                // Status Seen
                case "2.1": update.statusSeen = "true"; msgDesc = "Status Seen: ON"; break;
                case "2.2": update.statusSeen = "false"; msgDesc = "Status Seen: OFF"; break;
                // Auto Reply
                case "3.1": update.autoReply = "true"; msgDesc = "Auto Reply: ON"; break;
                case "3.2": update.autoReply = "false"; msgDesc = "Auto Reply: OFF"; break;
                // Auto Voice
                case "4.1": update.autoVoice = "true"; msgDesc = "Auto Voice: ON"; break;
                case "4.2": update.autoVoice = "false"; msgDesc = "Auto Voice: OFF"; break;
                // Auto Sticker
                case "5.1": update.autoSticker = "true"; msgDesc = "Auto Sticker: ON"; break;
                case "5.2": update.autoSticker = "false"; msgDesc = "Auto Sticker: OFF"; break;
                // Anti Bad
                case "6.1": update.antiBad = "true"; msgDesc = "Anti Bad: ON"; break;
                case "6.2": update.antiBad = "false"; msgDesc = "Anti Bad: OFF"; break;
                // Anti Link
                case "7.1": update.antiLink = "true"; msgDesc = "Anti Link: ON"; break;
                case "7.2": update.antiLink = "false"; msgDesc = "Anti Link: OFF"; break;
                // Anti Bot
                case "8.1": update.antiBot = "true"; msgDesc = "Anti Bot: ON"; break;
                case "8.2": update.antiBot = "false"; msgDesc = "Anti Bot: OFF"; break;
                // Online Status
                case "9.1": update.onlineStatus = "online"; msgDesc = "Online Status: ONLINE"; break;
                case "9.2": update.onlineStatus = "offline"; msgDesc = "Online Status: OFFLINE"; break;
                // Read Command
                case "10.1": update.readCommand = "true"; msgDesc = "Read Command: ON"; break;
                case "10.2": update.readCommand = "false"; msgDesc = "Read Command: OFF"; break;
                // Presence
                case "11.1": update.presence = "recording"; msgDesc = "Presence: RECORDING"; break;
                case "11.2": update.presence = "typing"; msgDesc = "Presence: TYPING"; break;
                case "11.3": update.presence = "off"; msgDesc = "Presence: OFF"; break;
                // Auto React
                case "12.1": update.autoReact = "true"; msgDesc = "Auto React: ON"; break;
                case "12.2": update.autoReact = "false"; msgDesc = "Auto React: OFF"; break;
                // AI Chat
                case "14.1": update.aiChat = "true"; msgDesc = "AI Chat: ON"; break;
                case "14.2": update.aiChat = "false"; msgDesc = "AI Chat: OFF"; break;
                // Anti Call
                case "15.1": update.antiCall = "true"; msgDesc = "Anti Call: ON"; break;
                case "15.2": update.antiCall = "false"; msgDesc = "Anti Call: OFF"; break;
                // Welcome
                case "16.1": update.welcome = "true"; msgDesc = "Welcome: ON"; break;
                case "16.2": update.welcome = "false"; msgDesc = "Welcome: OFF"; break;
                // Anti Delete
                case "17.1": update.antiDelete = "inbox"; msgDesc = "Anti Delete: INBOX ONLY"; break;
                case "17.2": update.antiDelete = "group"; msgDesc = "Anti Delete: GROUP ONLY"; break;
                case "17.3": update.antiDelete = "both"; msgDesc = "Anti Delete: BOTH"; break;
                case "17.4": update.antiDelete = "false"; msgDesc = "Anti Delete: OFF"; break;
                // TikTok
                case "18.1": update.autoTiktok = "true"; msgDesc = "TikTok Sender: ON"; break;
                case "18.2": update.autoTiktok = "false"; msgDesc = "TikTok Sender: OFF"; break;
                // News
                case "19.1": update.autoNews = "true"; msgDesc = "News Sender: ON"; break;
                case "19.2": update.autoNews = "false"; msgDesc = "News Sender: OFF"; break;
                // Status Like
                case "20.1": update.statusLike = "true"; msgDesc = "Status Like: ON"; break;
                case "20.2": update.statusLike = "false"; msgDesc = "Status Like: OFF"; break;
                // Movie Download
                case "22.1": update.movieDownload = "public"; msgDesc = "Movie Download: PUBLIC"; break;
                case "22.2": update.movieDownload = "private"; msgDesc = "Movie Download: PRIVATE"; break;
            }

            if (Object.keys(update).length > 0) {
                try {
                    const result = await Settings.findOneAndUpdate(
                        {}, 
                        { $set: update }, 
                        { upsert: true, returnDocument: 'after' }
                    );

                    if (result) {
                        Object.assign(config, update);
                        console.log("✅ DB Synced Successfully:", update);
                        return reply(`✅ *VEXTER-MD UPDATED*\n\n${msgDesc}`);
                    }
                } catch (err) {
                    console.error("❌ DB Update Error:", err);
                    return reply("❌ Database Update Error!");
                }
            }
        } 

        // --- 2. Auto Status Seen & React ---
        if (from === 'status@broadcast') {
            if (config.statusSeen === "true") await danuwa.readMessages([mek.key]);
            if (config.statusReact === "true") {
                const emojis = ['❤️', '🔥', '✨', '💯', '😎'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await danuwa.sendMessage(from, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant] });
            }
            return;
        }

        // --- 3. Plugin Hooks ---
        if (global.pluginHooks) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onMessage) {
                    try { await plugin.onMessage(danuwa, mek); } catch (e) { console.log(e); }
                }
            }
        }

        const m = sms(danuwa, mek);
        const isGroup = from.endsWith('@g.us');
        const mode = (config.workMode || "public").toLowerCase();
        
        if (!isOwner) {
            if (mode === "private" || (mode === "groups" && !isGroup) || (mode === "inbox" && isGroup)) return;
        }

        // --- 4. Command Execution ---
        const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
        if (isCmd) {
            const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
            if (cmd) {
                if (cmd.react) danuwa.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                try {
                    await cmd.function(danuwa, mek, m, {
                        from, quoted: mek, body, isCmd, command: commandName, 
                        isGroup, sender, senderNumber, isOwner, reply,
                    });
                } catch (e) { console.error(e); }
            }
        }
    });

    danuwa.ev.on('messages.update', async (updates) => {
        if (global.pluginHooks) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onDelete) {
                    try { await plugin.onDelete(danuwa, updates); } catch (e) { console.log(e); }
                }
            }
        }
    });
}

const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGODB_URL);
        console.log('✅ MongoDB Connected...');
    } catch (err) { console.error('❌ MongoDB Error:', err.message); }
};

connectDB();
ensureSessionFile();
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
