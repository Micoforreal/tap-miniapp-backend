const User = require("../models/User");

const updateSettings = async (req, res) => {
    const { userId, settings } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.settings = settings;
        await user.save();

        res.status(200).json({ message: "Settings updated", settings: user.settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { updateSettings };
