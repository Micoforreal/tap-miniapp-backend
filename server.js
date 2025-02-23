// Required dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require("./routes/user")
const settingRoutes = require("./routes/settings")
const leaderboardRoutes = require("./routes/leaderBoard");
const { logger } = require('./middleware/logger');
const { Telegraf } = require('telegraf');
const app = express();
const web_link = process.env.WEB_LINK
const TOKEN = process.env.BOT_TOKEN

const bot = new Telegraf(TOKEN)
// Middleware
app.use(logger)
app.use(cors());
app.use(express.json());

// Routes

app.use('/api/user',userRoutes)
app.use('/api/setting',settingRoutes)
app.use('/api/leaderboard',leaderboardRoutes)






// bot.start((ctx) =>
//     ctx.reply("Welcome :)))))", {
//       reply_markup: {
//         inline_keyboard: [[{ text: "web app", web_app: { url: web_link } }]],
        
//     },
//     })
//   );
  
//   bot.launch();




// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch(console.error);