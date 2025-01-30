const mongoose = require('mongoose');



const SettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  notifications: {
    enabled: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    volume: { type: Number, default: 70 },
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});


module.exports = mongoose.model('Setting', SettingsSchema)