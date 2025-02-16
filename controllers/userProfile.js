const express = require('express')
const axios = require("axios");

const botToken = process.env.BOT_TOKEN // Replace with your bot's tokn


const  getProfileUrl = async (telegramId) => {
  const url = `https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${telegramId}`;
  try {
    // Send request to get user info by Telegram ID
    const response = await axios.get(url);

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


module.exports = {getProfileUrl}