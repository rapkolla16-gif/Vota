const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    id: { type: String, default: "bot_settings" },
    workMode: { type: String, default: "public" },
    statusSeen: { type: String, default: "true" },
    autoReply: { type: String, default: "false" },
    autoVoice: { type: String, default: "false" },
    autoSticker: { type: String, default: "false" },
    antiBad: { type: String, default: "false" },
    antiLink: { type: String, default: "false" },
    antiBot: { type: String, default: "false" },
    onlineStatus: { type: String, default: "online" },
    readCommand: { type: String, default: "false" },
    presence: { type: String, default: "off" }, // recording, typing, off
    autoReact: { type: String, default: "false" },
    badNoBlock: { type: String, default: "false" },
    aiChat: { type: String, default: "false" },
    antiCall: { type: String, default: "false" },
    welcome: { type: String, default: "false" },
    antiDelete: { type: String, default: "false" }, // inbox, group, both, false
    autoTiktok: { type: String, default: "false" },
    autoNews: { type: String, default: "false" },
    statusLike: { type: String, default: "false" },
    replyType: { type: String, default: "default" },
    movieDownload: { type: String, default: "public" }
});

module.exports = mongoose.model('Settings', SettingsSchema);
