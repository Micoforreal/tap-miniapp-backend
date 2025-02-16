const express = require('express');
const router = express.Router();
const {authenticateUser} = require('../middleware/auth');
const User = require("../mongoose/models/User");
const { getProfileUrl } = require('../controllers/userProfile');


router.get('/',  async (req, res) => {
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
        let topUsers = sortedUsers.slice(0, 3);
        let otherUsers = sortedUsers.slice(3)
        otherUsers = await Promise.all(

            otherUsers.map(async (item)=>{
              item.profilePic= await getProfileUrl(item.telegramId)
              return item
               
                
            })
        )
        
        topUsers = await Promise.all(

            topUsers.map(async (item)=>{
              item.profilePic= await getProfileUrl(item.telegramId)
              return item
               
                
            })
        )
        console.log(topUsers)
        res.json({
            topUsers: topUsers,
            otherUsers: otherUsers,
         
            
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});


module.exports = router;