const express = require('express')

const router = express.Router()


const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require("../mongoose/models/User");
const { authenticateUser, authenticateToken } = require('../middleware/auth');
const axios = require("axios");
const {OpenAI}= require("openai");
const { getProfileUrl } = require('../controllers/userProfile');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const botToken = '7690253021:AAECH7uTJYYoG7pcGuz13WA82A0McZ-mRio'; // Replace with your bot's tokn

const getUserName = async (telegramId)=>{
  const url = `https://api.telegram.org/bot${botToken}/getChat?chat_id=${telegramId}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.ok) {
      const { first_name, last_name} = data.result;
      return ({first_name, last_name}) 
    } else {
      throw new Error('Unable to fetch user info.');
    }
  } catch (error) {
    console.error('Error:', error);
    return 'Unknown User';
  }


}


// Initialize or get user
router.post('/init', async (req, res) => {

    try {
      const { telegramId } = req.body;
      let user = await User.findOne({ telegramId });
      
      const profileUrl = await getProfileUrl(telegramId)
      const {first_name , last_name} = await getUserName(telegramId)
      if (!user) {
        user = await User.create({
          firstName:first_name,
          lastName:last_name,
          telegramId:telegramId,
          lastTapTime: new Date(0),
          lastDailyReward: new Date(0)
        });
      }

      const token = jwt.sign({ telegramId }, process.env.JWT_SECRET);
      
      res.json({
        token,
        user: {
          coins: user.coins,
          tickets: user.tickets,
          keys: user.keys,
          rank: user.rank,
          experience: user.experience,
          profilePic:profileUrl?profileUrl:null,
          firstName:user.firstName,
          lastName:user.lastName
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
  
  
  

  router.post("/generate-image",  async (req,res) => {
    const {prompt}= req.body
   
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });

     if(response.data && response.data[0].url) {
       res.json({
         imageUrl: response.data[0].url
       }) 
      }
      else {
        res.status(500).json({ message: 'Server error' });
      }

    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Server error' });
      
    }
    
  })
  router.get("/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url; // Image URL from OpenAI
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  
      res.set("Content-Type", "image/png");
      res.send(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch image" });
    }
  });



  router.post("/send-user-image", authenticateUser, async (req, res) => {
    try{
      const user = req.user;
      const TELEGRAM_API = `https://api.telegram.org/bot${botToken}/sendPhoto`;
      await axios.post(TELEGRAM_API, {
        chat_id: user,
        photo: req.body.imageUrl,
        caption: "Click the image to download it.",
      });

      res.status(200).json({message:"photo Sent"})
    }catch (error){
      res.status(400).json({message:"something went wrong"})
      console.log(error)

    }
  })

module.exports=router