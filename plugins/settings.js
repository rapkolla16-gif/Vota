const { cmd } = require("../command");
const Settings = require("../lib/settings"); 
const config = require("../config"); 

cmd(
  {
    pattern: "settings",
    desc: "Manage Bot Work Mode and Status Settings",
    category: "owner",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, isOwner, senderNumber, q, reply }) => {
    try {
        // --- 100% ශක්තිමත් OWNER CHECK එක ---
        const cleanSender = (senderNumber || "").replace(/[^0-9]/g, '');
        const cleanConfigOwner = (config.OWNER_NUMBER || "").replace(/[^0-9]/g, '');
        
        // නම්බර් එකේ කොටසක් හෝ සම්පූර්ණ නම්බර් එක මැච් වෙනවාද බලයි
        const isBotOwner = isOwner || cleanSender.includes(cleanConfigOwner) || cleanConfigOwner.includes(cleanSender);

        if (!isBotOwner) return reply("❌ *Access Denied:* Owner only.");

        // Database එකෙන් දැනට තියෙන settings කියවීම
        let data = await Settings.findOne({ id: "bot_settings" });
        if (!data) {
            data = await Settings.create({ 
                id: "bot_settings", 
                workMode: config.WORK_MODE || "public",
                statusSeen: config.AUTO_STATUS_SEEN || "true",
                statusReact: config.AUTO_STATUS_REACT || "true"
            });
        }

        if (!q) {
            const statusMsg = `⚙️ *VEXTER-MD SYSTEM SETTINGS* ⚙️\n\n` +
                              `1️⃣ *Work Mode:* ${data.workMode.toUpperCase()}\n` +
                              `2️⃣ *Auto Status Seen:* ${data.statusSeen === "true" ? "✅ ON" : "❌ OFF"}\n` +
                              `3️⃣ *Auto Status React:* ${data.statusReact === "true" ? "✅ ON" : "❌ OFF"}\n\n` +
                              `*How to change:* Use .settings <number>\n` +
                              `Example: .settings 2 (To Toggle Status Seen)`;
            return reply(statusMsg);
        }

        let choice = q.trim();
        let updateData = {};
        let msg = "";

        if (choice === "1") {
            // Work mode එක මාරු කිරීම (Cycle logic)
            const modes = ["public", "private", "groups", "inbox"];
            let nextIndex = (modes.indexOf(data.workMode) + 1) % modes.length;
            updateData.workMode = modes[nextIndex];
            config.WORK_MODE = updateData.workMode;
            msg = `✅ *Work Mode* updated to *${updateData.workMode.toUpperCase()}*`;
        } 
        else if (choice === "2") {
            // Status Seen ON/OFF
            updateData.statusSeen = data.statusSeen === "true" ? "false" : "true";
            config.AUTO_STATUS_SEEN = updateData.statusSeen;
            msg = `✅ *Auto Status Seen* is now *${updateData.statusSeen === "true" ? "ON" : "OFF"}*`;
        } 
        else if (choice === "3") {
            // Status React ON/OFF
            updateData.statusReact = data.statusReact === "true" ? "false" : "true";
            config.AUTO_STATUS_REACT = updateData.statusReact;
            msg = `✅ *Auto Status React* is now *${updateData.statusReact === "true" ? "ON" : "OFF"}*`;
        } 
        else {
            return reply("❌ *Invalid Selection:* Choose 1, 2, or 3.");
        }

        // Database Update
        await Settings.findOneAndUpdate({ id: "bot_settings" }, updateData);
        return reply(msg);

    } catch (e) {
        console.error(e);
        reply("❌ *Error:* Failed to update settings.");
    }
  }
);
