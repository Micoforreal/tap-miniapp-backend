const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Settings = require('../mongoose/models/Setting');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger'); // Custom logger

// Rate limiting for support contact endpoint
const contactSupportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many support requests from this IP, please try again later.',
});

// Get user settings
router.get('/', authenticateToken, async (req, res, next) => {
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
    logger.error(`Error fetching settings: ${error.message}`);
    next(error); // Pass error to centralized error handler
  }
});

// Update notifications settings
router.patch(
  '/notifications',
  authenticateToken,
  [body('enabled').isBoolean().withMessage('Enabled must be a boolean')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { enabled } = req.body;

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user.id },
        { 'notifications.enabled': enabled },
        { new: true }
      );

      res.json(settings);
    } catch (error) {
      logger.error(`Error updating notifications settings: ${error.message}`);
      next(error);
    }
  }
);

// Update sound settings
router.patch(
  '/sound',
  authenticateToken,
  [body('enabled').isBoolean().withMessage('Enabled must be a boolean')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { enabled } = req.body;

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user.id },
        { 'notifications.sound': enabled },
        { new: true }
      );

      res.json(settings);
    } catch (error) {
      logger.error(`Error updating sound settings: ${error.message}`);
      next(error);
    }
  }
);

// Update volume settings
router.patch(
  '/volume',
  authenticateToken,
  [
    body('volume')
      .isInt({ min: 0, max: 100 })
      .withMessage('Volume must be an integer between 0 and 100'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { volume } = req.body;

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user.id },
        { 'notifications.volume': volume },
        { new: true }
      );

      res.json(settings);
    } catch (error) {
      logger.error(`Error updating volume settings: ${error.message}`);
      next(error);
    }
  }
);

// Support contact endpoint
router.post(
  '/support/contact',
  authenticateToken,
  contactSupportLimiter,
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { subject, message } = req.body;

      // Here you would typically integrate with your email service
      // For example, using nodemailer or a service like SendGrid
      // For this example, we'll just log the support request
      logger.info(`Support request received: ${subject} - ${message}`);

      res.json({ message: 'Support request received' });
    } catch (error) {
      logger.error(`Error submitting support request: ${error.message}`);
      next(error);
    }
  }
);

module.exports = router;