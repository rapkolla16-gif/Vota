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
            setTimeout(() => {
                connectToWA();
            }, 2000);
        });
    } else {
        setTimeout(() => {
            connectToWA();
        }, 1000);
    }
}

const antiDeletePlugin = require('./plugins/antidelete.js');
global.pluginHooks = global.pluginHooks || [];
global.pluginHooks.push(antiDeletePlugin);

async function connectToWA() {
    console.log("Connecting VEXTER-MD 🧬...");
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
      console.log('🔄 Connection closed. Reason:', lastDisconnect?.error?.message || 'Unknown');
      
      if (shouldReconnect) {
        console.log('♻️ Reconnecting in 5 seconds...');
        setTimeout(() => connectToWA(), 5000); // එකපාරම Connect වෙන්න යන්නේ නැතිව තත්පර 5ක් ඉන්නවා
      }
    } else if (connection === 'open') {
      console.log('✅ VEXTER-MD connected to WhatsApp');
      // ... ඉතිරි ටික ...
    }
  });

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
        for (const msg of messages) {
            if (msg.messageStubType === 68) {
                await danuwa.sendMessageAck(msg.key);
            }
        }

        const mek = messages[0];
        if (!mek || !mek.message) return;
        mek.message = getContentType(mek.message) === 'ephemeralMessage' ? mek.message.ephemeralMessage.message : mek.message;

        if (global.pluginHooks) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onMessage) {
                    try {
                        await plugin.onMessage(danuwa, mek);
                    } catch (e) {
                        console.log("onMessage error:", e);
                    }
                }
            }
        }

        if (mek.key?.remoteJid === 'status@broadcast') {
            if (config.AUTO_STATUS_SEEN === "true") {
                try {
                    await danuwa.readMessages([mek.key]);
                    console.log(`[✓] Status seen: ${mek.key.id}`);
                } catch (e) {
                    console.error("❌ Failed to mark status as seen:", e);
                }
            }

            if (config.AUTO_STATUS_REACT === "true" && mek.key.participant) {
                try {
                    const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '💜', '💙', '🌝', '🖤', '💚'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                    await danuwa.sendMessage(mek.key.remoteJid, {
                        react: {
                            text: randomEmoji,
                            key: mek.key,
                        }
                    }, { statusJidList: [mek.key.participant] });

                    console.log(`[✓] Reacted to status`);
                } catch (e) {
                    console.error("❌ Failed to react to status:", e);
                }
            }
            return; // Status එකක් නම් message handling වලට යන්න එපා
        }

        const m = sms(danuwa, mek);
        const type = getContentType(mek.message);
        const from = mek.key.remoteJid;
        const body = type === 'conversation' ? mek.message.conversation : mek.message[type]?.text || mek.message[type]?.caption || '';
        const isCmd = body.startsWith(prefix);
        const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const q = args.join(' ');

        const sender = mek.key.fromMe ? danuwa.user.id : (mek.key.participant || mek.key.remoteJid);
        const senderNumber = sender.split('@')[0];
        const isGroup = from.endsWith('@g.us');
        const botNumber = danuwa.user.id.split(':')[0];
        const pushname = mek.pushName || 'User';
        const isOwner = (config.OWNER_NUMBER && config.OWNER_NUMBER.includes(senderNumber)) || botNumber.includes(senderNumber);
        const botNumber2 = await jidNormalizedUser(danuwa.user.id);

        const mode = (config.WORK_MODE || "public").toLowerCase();
        if (!isOwner) {
            if (mode === "private" || (mode === "groups" && !isGroup) || (mode === "inbox" && isGroup)) return;
        }

        const groupMetadata = isGroup ? await danuwa.groupMetadata(from).catch(() => {}) : '';
        const groupName = isGroup ? groupMetadata.subject : '';
        const participants = isGroup ? groupMetadata.participants : '';
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

        const reply = (text) => danuwa.sendMessage(from, { text }, { quoted: mek });

        if (isCmd) {
            const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
            if (cmd) {
                if (cmd.react) danuwa.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                try {
                    await cmd.function(danuwa, mek, m, {
                        from, quoted: mek, body, isCmd, command: commandName, args, q,
                        isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
                        isOwner, groupMetadata, groupName, participants, groupAdmins,
                        isBotAdmins, isAdmins, reply,
                    });
                } catch (e) {
                    console.error("[PLUGIN ERROR]", e);
                }
            }
        }

        for (const handler of replyHandlers) {
            if (handler.filter(body, { sender, message: mek })) {
                try {
                    await handler.function(danuwa, mek, m, {
                        from, quoted: mek, body, sender, reply,
                    });
                    break;
                } catch (e) {
                    console.log("Reply handler error:", e);
                }
            }
        }
    });

    danuwa.ev.on('messages.update', async (updates) => {
        if (global.pluginHooks) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onDelete) {
                    try {
                        await plugin.onDelete(danuwa, updates);
                    } catch (e) {
                        console.log("onDelete error:", e);
                    }
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
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
    }
};

connectDB();
ensureSessionFile();

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
