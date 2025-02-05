const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require("../mongoose/models/User");


router.get('/',  async (req, res, next) => {
    try {
        // Fetch all users from the database
        const users = await User.find({}).select('-_id');

        // Sort users based on coins first, then tapCount
        const sortedUsers = users.sort((a, b) => {
            if (b.coins !== a.coins) {
                return b.coins - a.coins;  // Higher coins come first
            } else {
                return b.tapCount - a.tapCount;  // If coins are equal, compare tapCount
            }
        });

        // Get the top 3 users
        const topUsers = sortedUsers.slice(0, 3);

        const otherUsers = sortedUsers.slice(3)
        // Send leaderboard data
        res.json({
            topUsers: topUsers,
            otherUsers: otherUsers
            
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});


module.exports = router;