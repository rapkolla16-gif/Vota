const { cmd } = require("../command");
const Settings = require("../lib/settings");
const config = require("../config"); // මේක අනිවාර්යයෙන්ම දාන්න 👈

cmd(
  {
    pattern: "settings",
    desc: "Change bot working mode and save to DB",
    category: "owner",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, isOwner, senderNumber, q, reply }) => {
    
    // index.js එකෙන් එන isOwner එකට අමතරව කෙලින්ම config එකෙනුත් චෙක් කරමු
    const isBotOwner = isOwner || (config.OWNER_NUMBER && config.OWNER_NUMBER.includes(senderNumber));

    if (!isBotOwner) return reply("❌ *Access Denied:* Owner only.");

    if (!q) {
        const data = await Settings.findOne({ id: "bot_settings" }) || { workMode: "public" };
        const statusMsg = `⚙️ *VEXTER-MD SYSTEM SETTINGS* ⚙️\n\n` +
                          `*Current Mode:* ${data.workMode.toUpperCase()}\n\n` +
                          `Select a mode:\n` +
                          `1️⃣ *Public Mode*\n` +
                          `2️⃣ *Private Mode*\n` +
                          `3️⃣ *Groups Only*\n` +
                          `4️⃣ *Inbox Only*\n\n` +
                          `*Example:* .settings 1`;
        return reply(statusMsg);
    }

    let choice = q.trim();
    let newMode = "";

    if (choice === "1") newMode = "public";
    else if (choice === "2") newMode = "private";
    else if (choice === "3") newMode = "groups";
    else if (choice === "4") newMode = "inbox";
    else return reply("❌ *Invalid Selection:* Choose 1-4.");

    // Database එක update කිරීම
    await Settings.findOneAndUpdate(
        { id: "bot_settings" },
        { workMode: newMode },
        { upsert: true, new: true }
    );
    
    // Runtime එකේදී config එකත් update කරන්න (බොට් Restart වෙනකම් ඉන්න ඕන වෙන්නේ නැහැ එතකොට)
    config.WORK_MODE = newMode;

    return reply(`✅ *Success:* Bot mode permanently updated to *${newMode.toUpperCase()}*.`);
  }
);
