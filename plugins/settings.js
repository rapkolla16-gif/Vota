const { cmd } = require("../command");
const Settings = require("../lib/settings"); // MongoDB Schema එක
const config = require("../config"); // Config එක අනිවාර්යයෙන්ම ඕනේ

cmd(
  {
    pattern: "settings",
    desc: "Change bot working mode and save to DB",
    category: "owner",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, isOwner, senderNumber, q, reply }) => {
    try {
        // --- ශක්තිමත් OWNER CHECK එක ---
        // 1. නම්බර් එකේ තියෙන ලකුණු අයින් කරලා පිරිසිදු කරගන්නවා (94783462955 වගේ)
        const cleanSender = (senderNumber || "").replace(/[^0-9]/g, '');
        const cleanConfigOwner = (config.OWNER_NUMBER || "").replace(/[^0-9]/g, '');
        
        // 2. index.js එකෙන් එන isOwner හෝ නම්බර් දෙක සමානද කියලා බලනවා
        const isBotOwner = isOwner || cleanConfigOwner.includes(cleanSender);

        if (!isBotOwner) {
            return reply(`❌ *Access Denied:* Owner only.\n\n*Your Number:* ${cleanSender}\n*Config Number:* ${cleanConfigOwner}`);
        }

        // --- ප්ලගින් ලොජික් එක ---
        if (!q) {
            // Database එකෙන් දැනට තියෙන mode එක ගන්නවා (නැත්නම් default public)
            const data = await Settings.findOne({ id: "bot_settings" }) || { workMode: "public" };
            
            const statusMsg = `⚙️ *VEXTER-MD SYSTEM SETTINGS* ⚙️\n\n` +
                              `*Current Mode:* ${data.workMode.toUpperCase()}\n\n` +
                              `Select a mode by sending the number:\n` +
                              `1️⃣ *Public Mode* (All chats)\n` +
                              `2️⃣ *Private Mode* (Owner only)\n` +
                              `3️⃣ *Groups Only* (No inbox)\n` +
                              `4️⃣ *Inbox Only* (No groups)\n\n` +
                              `*Usage:* .settings 1`;
            return reply(statusMsg);
        }

        let choice = q.trim();
        let newMode = "";

        // ඉලක්කම් අනුව mode එක තෝරාගැනීම
        if (choice === "1") newMode = "public";
        else if (choice === "2") newMode = "private";
        else if (choice === "3") newMode = "groups";
        else if (choice === "4") newMode = "inbox";
        else return reply("❌ *Invalid Selection:* Please choose a number between 1 and 4.");

        // 1. Database එකට ස්ථිරවම save කිරීම
        await Settings.findOneAndUpdate(
            { id: "bot_settings" },
            { workMode: newMode },
            { upsert: true, new: true }
        );

        // 2. දැනට බොට් වැඩ කරන mode එක (Runtime Config) එකපාරම update කිරීම
        config.WORK_MODE = newMode;

        return reply(`✅ *Success:* Bot mode permanently updated to *${newMode.toUpperCase()}*.\n\n*Note:* No restart required.`);

    } catch (e) {
        console.error("Settings Plugin Error:", e);
        reply("❌ *Error:* An error occurred while updating settings.");
    }
  }
);
