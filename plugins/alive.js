const config = require('../config')
const { cmd, commands } = require('../command')
const { runtime } = require('../lib/functions')

cmd({
    pattern: "alive",
    desc: "Check if the bot is active",
    category: "main",
    react: "🧬",
    filename: __filename
},
async(conn, mek, m, { from, quoted, reply, prefix }) => { // මෙතනට prefix එක එකතු කළා
    try {
        const startTime = Date.now();
        const ping = Date.now() - startTime; 

        let aliveMsg = `╭───「 *VEXTER-MD IS ALIVE* 」───⊷
│
│ 👤 *User:* ${m.pushName}
│ ⏳ *Uptime:* ${runtime(process.uptime())}
│ ⚡ *Speed:* ${ping}ms
│ 🧬 *Version:* 1.0.2 (Stable)
│ 🛠️ *Prefix:* ${prefix}
│
├──────────────────────────⊷
│
│ *Created By Dexter*
│ *Powered By Ranu Social Booster*
│
╰──────────────────────────⊷
> *Type ${prefix}menu to see commands* 🧬`

        await conn.sendMessage(from, { 
            image: { url: config.ALIVE_IMG }, 
            caption: aliveMsg,
            contextInfo: {
                externalAdReply: {
                    title: "🧬 VEXTER-MD ONLINE",
                    body: "Created By Dexter | Official Bot",
                    mediaType: 1,
                    thumbnailUrl: config.ALIVE_IMG,
                    renderLargerThumbnail: false,
                    sourceUrl: "https://wa.me/94783462955"
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.log(e)
        reply(`${e}`)
    }
})
