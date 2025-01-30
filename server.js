// Required dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const {logger} = require("./middleware/logger")
const userRoutes = require("./routes/user")
const settingRoutes = require("./routes/settings")

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger)

// Routes

app.use('/api/user',userRoutes)
app.use('/api/setting',settingRoutes)

app.get("/hii", (req, res)=>{
    res.json({message:"hi"})

})






// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch(console.error);