const config = require('../config')
const { cmd, commands } = require('../command')
const { runtime } = require('../lib/functions')

cmd({
    pattern: "menu",
    alias: ["panel","list"],
    desc: "Show the main menu of the bot",
    category: "main",
    react: "🧬",
    filename: __filename
},
async(conn, mek, m,{from, quoted, reply}) => {
    try{
        let menuMsg = `╭───「 *VEXTER-MD MAIN MENU* 」───⊷
│
│ 👤 *User:* ${m.pushName}
│ ⏳ *Uptime:* ${runtime(process.uptime())}
│ 🧬 *Mode:* ${config.workMode}
│ 🛠️ *Prefix:* ${config.PREFIX}
│
├──────────────────────────⊷
│
│ *Reply a number to explore:*
│
│ 🧬 *1* - Download Commands 📥
│ 🧬 *2* - Group Commands 👥
│ 🧬 *3* - Owner Commands 👑
│ 🧬 *4* - Search Commands 🔍
│
╰──────────────────────────⊷
> *Created By Dexter* 🧬`

        await conn.sendMessage(from, { 
            image: { url: config.ALIVE_IMG }, 
            caption: menuMsg,
            contextInfo: {
                externalAdReply: {
                    title: "🧬 VEXTER-MD MULTI DEVICE",
                    body: "Select an option by replying with the number",
                    mediaType: 1,
                    thumbnailUrl: config.ALIVE_IMG,
                    renderLargerThumbnail: true,
                    sourceUrl: "https://wa.me/94783462955"
                }
            }
        }, { quoted: mek });

    } catch(e) {
        console.log(e)
        reply(`${e}`)
    }
})
