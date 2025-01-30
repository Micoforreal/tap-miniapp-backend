// Required dependencies
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Settings = require('../mongoose/models/Setting');
const { authenticateToken } = require('../middleware/auth');

// User Settings Schema


// Middleware for authentication
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ error: 'Access token required' });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ error: 'Invalid or expired token' });
//     }
//     req.user = user;
//     next();
//   });
// };

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.id });
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = new Settings({ userId: req.user.id });
      await defaultSettings.save();
      return res.json(defaultSettings);
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

// Update notifications settings
router.patch('/notifications', authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      { 'notifications.enabled': enabled },
      { new: true }
    );
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Error updating notifications settings' });
  }
});

// Update sound settings
router.patch('/sound', authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      { 'notifications.sound': enabled },
      { new: true }
    );
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Error updating sound settings' });
  }
});

// Update volume settings
router.patch('/volume', authenticateToken, async (req, res) => {
  try {
    const { volume } = req.body;
    
    if (volume < 0 || volume > 100) {
      return res.status(400).json({ error: 'Volume must be between 0 and 100' });
    }
    
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      { 'notifications.volume': volume },
      { new: true }
    );
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Error updating volume settings' });
  }
});

// Support contact endpoint
router.post('/support/contact', authenticateToken, async (req, res) => {
  try {
    const { subject, message } = req.body;
    
    // Here you would typically integrate with your email service
    // For example, using nodemailer or a service like SendGrid
    // For this example, we'll just return a success response
    
    res.json({ message: 'Support request received' });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting support request' });
  }
});

module.exports = router;
