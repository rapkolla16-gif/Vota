const config = require('../config')
const { cmd, commands } = require('../command')

// --- 🚫 BLOCK COMMAND ---
cmd({
    pattern: "block",
    desc: "Block a user from WhatsApp",
    category: "owner",
    react: "🚫",
    filename: __filename
},
async(conn, mek, m, { from, isOwner, reply, quoted }) => {
    try {
        if (!isOwner) return reply("❌ *This command is only for Dexter!*");

        let jid;
        if (quoted) {
            jid = quoted.sender; // මැසේජ් එකකට රිප්ලයි කරලා නම්
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            jid = m.mentionedJid[0]; // මැන්ෂන් කරලා නම්
        } else {
            return reply("⚠️ *Please reply to a message or mention a user to block.*");
        }

        await conn.updateBlockStatus(jid, "block");
        reply(`✅ *Successfully Blocked:* @${jid.split('@')[0]}`, { mentions: [jid] });

    } catch (e) {
        console.log(e)
        reply(`❌ Error: ${e.message}`)
    }
})

// --- ✅ UNBLOCK COMMAND ---
cmd({
    pattern: "unblock",
    desc: "Unblock a user from WhatsApp",
    category: "owner",
    react: "🔓",
    filename: __filename
},
async(conn, mek, m, { from, isOwner, reply, quoted }) => {
    try {
        if (!isOwner) return reply("❌ *This command is only for Dexter!*");

        let jid;
        if (quoted) {
            jid = quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            jid = m.mentionedJid[0];
        } else {
            return reply("⚠️ *Please reply to a message or mention a user to unblock.*");
        }

        await conn.updateBlockStatus(jid, "unblock");
        reply(`✅ *Successfully Unblocked:* @${jid.split('@')[0]}`, { mentions: [jid] });

    } catch (e) {
        console.log(e)
        reply(`❌ Error: ${e.message}`)
    }
})
