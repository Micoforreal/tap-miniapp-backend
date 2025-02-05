// Required dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require("./routes/user")
const settingRoutes = require("./routes/settings")
const leaderboardRoutes = require("./routes/leaderBoard")
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.use('/api/user',userRoutes)
app.use('/api/setting',settingRoutes)
app.use('/api/leaderboard',leaderboardRoutes)






// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch(console.error);