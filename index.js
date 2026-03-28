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
        const savedSettings = await Settings.findOne({ id: "bot_settings" });
        if (savedSettings) {
            config.WORK_MODE = savedSettings.workMode || config.WORK_MODE;
            config.AUTO_STATUS_SEEN = savedSettings.statusSeen || config.AUTO_STATUS_SEEN;
            config.AUTO_STATUS_REACT = savedSettings.statusReact || config.AUTO_STATUS_REACT;
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
                image: { url: `https://i.ibb.co/ZRXhhYxH/db1c9ed7-6513-49da-8105-f21c73583135.png` },
                caption: up
            });
            fs.readdirSync("./plugins/").forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() === ".js") {
                    require(`./plugins/${plugin}`);
                }
            });
        }
    });

    danuwa.ev.on('creds.update', saveCreds);

    danuwa.ev.on('messages.upsert', async ({ messages }) => {
        const mek = messages[0];
        if (!mek || !mek.message) return;
        
        // --- basic variables ---
        const from = mek.key.remoteJid;
        const type = getContentType(mek.message);
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (mek.message[type]?.caption || '');
        const sender = mek.key.fromMe ? danuwa.user.id : (mek.key.participant || mek.key.remoteJid);
        const senderNumber = sender.split('@')[0].replace(/[^0-9]/g, '');
        const isOwner = config.OWNER_NUMBER.includes(senderNumber) || mek.key.fromMe;
        const isCmd = body.startsWith(prefix);
        const reply = (text) => danuwa.sendMessage(from, { text }, { quoted: mek });

        // --- 1. Settings Panel Reply Handler ---
        if (!isCmd && isOwner && body) {
            let update = {};
            let msgDesc = "";
            const input = body.trim();
            const Settings = require('./lib/settings');

            switch(input) {
                case "1.1": update.workMode = "public"; msgDesc = "Work Mode: PUBLIC"; break;
                case "1.2": update.workMode = "private"; msgDesc = "Work Mode: PRIVATE"; break;
                case "1.3": update.workMode = "groups"; msgDesc = "Work Mode: GROUPS"; break;
                case "1.4": update.workMode = "inbox"; msgDesc = "Work Mode: INBOX"; break;
                case "2.1": update.statusSeen = "true"; msgDesc = "Auto Status Seen: ON"; break;
                case "2.2": update.statusSeen = "false"; msgDesc = "Auto Status Seen: OFF"; break;
                case "3.1": update.autoReply = "true"; msg = "Auto Reply: ON"; break;
        case "3.2": update.autoReply = "false"; msg = "Auto Reply: OFF"; break;

        // [4] AUTO VOICE
        case "4.1": update.autoVoice = "true"; msg = "Auto Voice: ON"; break;
        case "4.2": update.autoVoice = "false"; msg = "Auto Voice: OFF"; break;

        // [5] AUTO STICKER
        case "5.1": update.autoSticker = "true"; msg = "Auto Sticker: ON"; break;
        case "5.2": update.autoSticker = "false"; msg = "Auto Sticker: OFF"; break;

        // [6] ANTI BAD
        case "6.1": update.antiBad = "true"; msg = "Anti Bad: ON"; break;
        case "6.2": update.antiBad = "false"; msg = "Anti Bad: OFF"; break;

        // [7] ANTI LINK
        case "7.1": update.antiLink = "true"; msg = "Anti Link: ON"; break;
        case "7.2": update.antiLink = "false"; msg = "Anti Link: OFF"; break;
// [8] ANTI BOT
        case "8.1": update.antiBot = "true"; msg = "Anti Bot: ON"; break;
        case "8.2": update.antiBot = "false"; msg = "Anti Bot: OFF"; break;

        // [9] ALWAYS ONLINE
        case "9.1": update.onlineStatus = "online"; msg = "Online Status: ONLINE"; break;
        case "9.2": update.onlineStatus = "offline"; msg = "Online Status: OFFLINE"; break;

        // [10] READ COMMAND
        case "10.1": update.readCommand = "true"; msg = "Read Command: ON"; break;
        case "10.2": update.readCommand = "false"; msg = "Read Command: OFF"; break;

        // [11] TYPING/RECORDING
        case "11.1": update.presence = "recording"; msg = "Presence: RECORDING"; break;
        case "11.2": update.presence = "typing"; msg = "Presence: TYPING"; break;
        case "11.3": update.presence = "off"; msg = "Presence: OFF"; break;

                    case "12.1": update.autoReact = "true"; msgDesc = "Auto React: ON"; break;
                case "12.2": update.autoReact = "false"; msgDesc = "Auto React: OFF"; break;

                    // [14] AI CHAT
        case "14.1": update.aiChat = "true"; msg = "AI Chat: ON"; break;
        case "14.2": update.aiChat = "false"; msg = "AI Chat: OFF"; break;

        // [15] ANTI CALL
        case "15.1": update.antiCall = "true"; msg = "Anti Call: ON"; break;
        case "15.2": update.antiCall = "false"; msg = "Anti Call: OFF"; break;

        // [16] WELCOME
        case "16.1": update.welcome = "true"; msg = "Welcome: ON"; break;
        case "16.2": update.welcome = "false"; msg = "Welcome: OFF"; break;

        // [17] ANTI DELETE
        case "17.1": update.antiDelete = "inbox"; msg = "Anti Delete: INBOX ONLY"; break;
        case "17.2": update.antiDelete = "group"; msg = "Anti Delete: GROUP ONLY"; break;
        case "17.3": update.antiDelete = "both"; msg = "Anti Delete: BOTH"; break;
        case "17.4": update.antiDelete = "false"; msg = "Anti Delete: OFF"; break;

        // [18] TIKTOK
        case "18.1": update.autoTiktok = "true"; msg = "TikTok Sender: ON"; break;
        case "18.2": update.autoTiktok = "false"; msg = "TikTok Sender: OFF"; break;

                    case "19.1": update.autoNews = "true"; msg = "News Sender: ON"; break;
        case "19.2": update.autoNews = "false"; msg = "News Sender: OFF"; break;

        // [20] STATUS LIKE
        case "20.1": update.statusLike = "true"; msg = "Status Like: ON"; break;
        case "20.2": update.statusLike = "false"; msg = "Status Like: OFF"; break;

        // [21] REPLY TYPE
        case "21.1": update.replyType = "default"; msg = "Reply Type: DEFAULT"; break;
        case "21.2": update.replyType = "custom"; msg = "Reply Type: CUSTOM"; break;

        // [22] MOVIE DOWNLOAD
        case "22.1": update.movieDownload = "public"; msg = "Movie Download: PUBLIC"; break;
        case "22.2": update.movieDownload = "private"; msg = "Movie Download: PRIVATE"; break;
                    
                
                // Add more cases here from your settings list
            }

            if (Object.keys(update).length > 0) {
                try {
                    // මෙතන id: "bot_settings" වෙනුවට මෙහෙම දාලා බලන්න
                    const result = await Settings.findOneAndUpdate({}, update, { upsert: true, new: true });
                    
                    if (result) {
                        Object.assign(config, update); 
                        console.log("✅ Database Updated:", update);
                        return reply(`✅ *VEXTER-MD UPDATED*\n\n${msgDesc}`);
                    }
                } catch (err) {
                    console.error("❌ DB Update Error:", err);
                    return reply("❌ Database එක Update කිරීමේදී දෝෂයක් ඇති විය.");
                }
            }

        // --- 2. Status handling ---
        if (from === 'status@broadcast') {
            if (config.AUTO_READ_STATUS === "true") await danuwa.readMessages([mek.key]);
            if (config.AUTO_STATUS_REACT === "true") {
                const emojis = ['❤️', '🔥', '✨', '💯', '😎'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await danuwa.sendMessage(from, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant] });
            }
            return;
        }

        // --- 3. Plugin Hooks & Commands ---
        if (global.pluginHooks) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onMessage) {
                    try { await plugin.onMessage(danuwa, mek); } catch (e) { console.log(e); }
                }
            }
        }

        const m = sms(danuwa, mek);
        const isGroup = from.endsWith('@g.us');
        const mode = (config.WORK_MODE || "public").toLowerCase();
        
        if (!isOwner) {
            if (mode === "private" || (mode === "groups" && !isGroup) || (mode === "inbox" && isGroup)) return;
        }

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
