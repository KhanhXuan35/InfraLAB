const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    name: String,
    category: String,
    description: String,
    image: String
}, { timestamps: true });

module.exports = mongoose.model("Device", deviceSchema);
