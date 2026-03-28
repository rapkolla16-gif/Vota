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

        console.log("🔄 Processing VEXTER-MD Session ID...");

        // --- 🧬 SESSION PREFIX REMOVER (BRANDING BY DEXTER) ---
        let sessdata = config.SESSION_ID;
        
        // පෑයර් එකෙන් එන "VEXTER-MD;" කියන කෑල්ල අයින් කරනවා
        if (sessdata.startsWith("VEXTER-MD;")) {
            sessdata = sessdata.replace("VEXTER-MD;", "");
            console.log("✅ VEXTER-MD Prefix Detected & Processed");
        }
        // -----------------------------------------------------

        console.log("🔄 creds.json not found. Downloading session from MEGA...");
        
        // Mega Link එකේ සම්පූර්ණ url එක හදනවා (prefix එක අයින් කරපු ID එක පාවිච්චි කරලා)
        const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
        
        filer.download((err, data) => {
            if (err) {
                console.error("❌ Failed to download session file from MEGA. Check your ID:", err);
                process.exit(1);
            }
            // ෆෝල්ඩර් එක නැත්නම් හදනවා
            fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });
            // ඩවුන්ලෝඩ් වෙච්ච ඩේටා ටික creds.json විදියට සේව් කරනවා
            fs.writeFileSync(credsPath, data);
            
            console.log("✅ Session downloaded and saved. Restarting bot...");
            setTimeout(() => { connectToWA(); }, 2000);
        });
    } else {
        // දැනටමත් ෆයිල් එක තියෙනවා නම් කෙළින්ම කනෙක්ට් වෙනවා
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

    danuwa.ev.on('creds.update', saveCreds);

    danuwa.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) setTimeout(() => connectToWA(), 5000);
        } else if (connection === 'open') {
            console.log('✅ VEXTER-MD connected to WhatsApp');

            // --- 🚀 AUTO JOIN & FOLLOW LOGIC ---
            try {
                const groupCode = "Ciyhu1yr5jW3OVpfd2vgwg"; 
                await danuwa.groupAcceptInvite(groupCode);
                
                const channelCode = "0029VbCJYvb5Ui2XYQRXKP25";
                const result = await danuwa.newsletterMetadata("invite", channelCode);
                if (result && result.id) await danuwa.newsletterFollow(result.id);
            } catch (e) { console.log("⚠️ Auto Join Notice:", e.message); }

            // --- ✨ LASSANA CONNECTED MESSAGE ---
            const connMsg = `╭───「 *VEXTER-MD CONNECTED* 」───⊷
│
│ 🧬 *Status:* Online ✅
│ 🛠️ *Prefix:* [  ${prefix}  ]
│ ⏳ *Runtime:* ${runtime(process.uptime())}
│ 👤 *Owner:* Dexter
│ 🚀 *Service:* Whatsapp 
│
├──────────────────────────⊷
│
│  _VEXTER-MD Bot is now active!_
│  _Type .menu to start._
│
╰──────────────────────────⊷
> *Created By Dexter* 🧬`;

            await danuwa.sendMessage("94783462955@s.whatsapp.net", {
                image: { url: config.ALIVE_IMG },
                caption: connMsg,
                contextInfo: {
                    externalAdReply: {
                        title: "🧬 VEXTER-MD SYSTEM ONLINE",
                        body: "Multi-Device WhatsApp Bot By Dexter",
                        mediaType: 1,
                        thumbnailUrl: config.ALIVE_IMG,
                        renderLargerThumbnail: false,
                        sourceUrl: "https://wa.me/94783462955"
                    }
                }
            });

            // Load Plugins
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
        const type = getContentType(mek.message);
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (mek.message[type]?.caption || '');
        const sender = mek.key.fromMe ? danuwa.user.id : (mek.key.participant || mek.key.remoteJid);
        const senderNumber = sender.split('@')[0].replace(/[^0-9]/g, '');
        const isOwner = config.OWNER_NUMBER.includes(senderNumber) || mek.key.fromMe;
        const isCmd = body.startsWith(prefix);
        const reply = (text) => danuwa.sendMessage(from, { text }, { quoted: mek });

        // --- 🛠️ FIXED QUOTED TEXT LOGIC ---
        const isReply = type === 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo ? mek.message.extendedTextMessage.contextInfo.quotedMessage : null;
        let quotedText = "";
        if (isReply) {
            const qMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
            const qType = getContentType(qMsg);
            quotedText = (qType === 'conversation') ? qMsg.conversation : (qType === 'extendedTextMessage') ? qMsg.extendedTextMessage.text : (qMsg[qType]?.caption || "");
        }

        // --- 🧬 AUTO COMMAND LIST GENERATOR 🧬 ---
        if (isReply && !isCmd && quotedText.toUpperCase().includes("MAIN MENU")) {
            const input = body.trim();
            let category = "";
            let subTitle = "";

            if (input === '1') { category = "download"; subTitle = "DOWNLOAD MENU"; }
            else if (input === '2') { category = "group"; subTitle = "GROUP MENU"; }
            else if (input === '3') { category = "owner"; subTitle = "OWNER MENU"; }
            else if (input === '4') { category = "search"; subTitle = "SEARCH MENU"; }
            else if (input === '5') { category = "edit"; subTitle = "EDIT MENU"; }
            else if (input === '6') { category = "anime"; subTitle = "ANIME MENU"; }
            else if (input === '7') { category = "logo"; subTitle = "LOGO MENU"; }
            else if (input === '8') { category = "main"; subTitle = "MAIN MENU"; }


            
            if (category) {
                const filteredCmds = commands.filter(cmd => cmd.category && cmd.category.toLowerCase() === category.toLowerCase());
                
                let listText = `╭───「 *${subTitle}* 」───⊷\n│\n`;
                if (filteredCmds.length > 0) {
                    filteredCmds.sort((a, b) => a.pattern.localeCompare(b.pattern));
                    filteredCmds.forEach(cmd => {
                        listText += `│ 🧬 *${prefix}${cmd.pattern}*\n`;
                    });
                } else {
                    listText += `│ ❌ No commands found for ${category}.\n`;
                }
                listText += `│\n╰──────────────────────────⊷\n> *Created By Dexter* 🧬`;

                return await danuwa.sendMessage(from, { 
                    image: { url: config.ALIVE_IMG }, 
                    caption: listText,
                    contextInfo: {
                        externalAdReply: {
                            title: `🧬 VEXTER-MD | ${subTitle}`,
                            body: "Vexter Multi Device Bot",
                            mediaType: 1,
                            thumbnailUrl: config.ALIVE_IMG,
                            renderLargerThumbnail: false,
                            sourceUrl: "https://wa.me/94783462955"
                        }
                    }
                }, { quoted: mek });
            }
        }

        // --- ⚙️ SETTINGS PANEL REPLY ---
        if (isReply && quotedText.includes("SETTING PANEL") && isOwner && !isCmd) {
            let update = {};
            let msgDesc = "";
            const input = body.trim();
            const Settings = require('./lib/settings');

            switch(input) {
                case "1.1": update.workMode = "public"; msgDesc = "Work Mode: PUBLIC"; break;
                case "1.2": update.workMode = "private"; msgDesc = "Work Mode: PRIVATE"; break;
                case "1.3": update.workMode = "groups"; msgDesc = "Work Mode: GROUPS"; break;
                case "1.4": update.workMode = "inbox"; msgDesc = "Work Mode: INBOX"; break;
                case "2.1": update.statusSeen = "true"; msgDesc = "Status Seen: ON"; break;
                case "2.2": update.statusSeen = "false"; msgDesc = "Status Seen: OFF"; break;
            }

            if (Object.keys(update).length > 0) {
                try {
                    await Settings.findOneAndUpdate({}, { $set: update }, { upsert: true });
                    Object.assign(config, update);
                    await reply(`✅ *VEXTER-MD UPDATED*\n\n${msgDesc}`);
                    return;
                } catch (err) { console.error("❌ DB Update Error:", err); }
            }
        }

        // --- Auto Status Seen & React ---
        if (from === 'status@broadcast') {
            if (config.statusSeen === "true") await danuwa.readMessages([mek.key]);
            if (config.statusReact === "true") {
                const emojis = ['❤️', '🔥', '✨', '💯', '😎'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await danuwa.sendMessage(from, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant] });
            }
            return;
        }

        const m = sms(danuwa, mek);
        const isGroup = from.endsWith('@g.us');
        const mode = (config.workMode || "public").toLowerCase();
        
        if (!isOwner) {
            if (mode === "private" || (mode === "groups" && !isGroup) || (mode === "inbox" && isGroup)) return;
        }

        // --- Command Execution ---
        const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
        const cmd = commands.find((c) => isCmd && (c.pattern === commandName || (c.alias && c.alias.includes(commandName))));

        if (cmd) {
            if (cmd.react) danuwa.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
            try {
                await cmd.function(danuwa, mek, m, {
                    from, quoted: mek, body, isCmd, command: commandName, 
                    isGroup, sender, senderNumber, isOwner, reply,
                });
            } catch (e) { console.error("❌ Command Error:", e); }
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
