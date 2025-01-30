const express = require('express')

const router = express.Router()


const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require("../mongoose/models/User");
const { authenticateUser, authenticateToken } = require('../middleware/auth');

const axios = require("axios");







const getProfileUrl = async (telegramId) => {
  const botToken = '7635121657:AAGUq8flSMrIx2p5mMOXBPmLNmePP2j7nJQ'; // Replace with your bot's token
  const url = `https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${telegramId}`;

  // https://api.telegram.org/bot${/getUserProfilePhotos?user_id=7778611573

  try {
    // Send request to get user info by Telegram ID
    const response = await axios.get(url);


    console.log(response.data)
    // Check if the response is successful
    if (response.data && response.data.result && response.data.result.photos.length > 0) {
      const fileId = response.data.result.photos[0][0].file_id;
      // Get the file path for the profile photo
      const fileResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);

      if (fileResponse.data && fileResponse.data.result) {
        return `https://api.telegram.org/file/bot${botToken}/${fileResponse.data.result.file_path}`;
      } else {
        console.error('Failed to fetch file path');
      }
    } else {
      console.error('Failed to fetch user profile photos');
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
};


// Initialize or get user
router.post('/init', async (req, res) => {

    try {
      const { telegramId } = req.body;

      // const response = await getUserInfo(telegramId);
      // console.log(response)
      
      let user = await User.findOne({ telegramId });
      
      if (!user) {
        user = await User.create({
          telegramId:telegramId,
          lastTapTime: new Date(0),
          lastDailyReward: new Date(0)
        });
      }


      const token = jwt.sign({ telegramId }, process.env.JWT_SECRET);
      const profileUrl = await getProfileUrl(telegramId)
      
      res.json({
        token,
        user: {
          coins: user.coins,
          tickets: user.tickets,
          keys: user.keys,
          rank: user.rank,
          experience: user.experience,
          profileUrl: profileUrl?profileUrl:null
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Server error' });
    }
  });






  // Handle tap
router.post('/tap', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const now = new Date();
      const {coin,tapCount} =req.body
      
      // Prevent rapid tapping (minimum 500ms between taps)
      if (now - user.lastTapTime < 500) {
        return res.status(429).json({ message: 'Tapping too fast' });
      }
  
      // Calculate rewards
      const coinReward = coin // 1-3 coins per tap
      const experienceReward = 1;
      console.log(tapCount)
  
      // Update user
      user.coins += tapCount;
      user.experience += experienceReward;
      user.tapCount +=  tapCount;
      user.lastTapTime = now;
  
      // Level up mechanics (every 100 experience)
      if (user.experience >= 100) {
        user.rank += 100;
        user.experience = user.experience % 100;
        user.tickets += 1; // Reward ticket on level up
      }
  
      await user.save();
  
      res.json({
        rewards: {
          coins: tapCount,
          experience: experienceReward

        },
        user: {
          coins: user.coins,
          tickets: user.tickets,
          keys: user.keys,
          rank: user.rank,
          experience: user.experience
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

  





  // Claim daily reward
router.post('/daily-reward', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const now = new Date();
      const lastReward = new Date(user.lastDailyReward);
      
      // Check if 24 hours have passed
      if (now - lastReward < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ 
          message: 'Daily reward not yet available',
          nextReward: new Date(lastReward.getTime() + 24 * 60 * 60 * 1000)
        });
      }
  
      // Daily reward: 50 coins, 1 key
      user.coins += 50;
      user.keys += 1;
      user.lastDailyReward = now;
  
      await user.save();
  
      res.json({
        rewards: {
          coins: 50,
          keys: 1
        },
        user: {
          coins: user.coins,
          tickets: user.tickets,
          keys: user.keys,
          rank: user.rank,
          experience: user.experience
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  





// Get user stats
router.get('/stats', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      
      res.json({
        tapCount: user.tapCount,
        coins: user.coins,
        tickets: user.tickets,
        keys: user.keys,
        rank: user.rank,
        experience: user.experience
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  

module.exports=router