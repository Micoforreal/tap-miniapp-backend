const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    coins: { type: Number, default: 500 },
    tickets: { type: Number, default: 0 },
    keys: { type: Number, default: 2 },
    rank: { type: Number, default: 1000 },
    tapCount: { type: Number, default: 0 },
    lastTapTime: { type: Date },
    lastDailyReward: { type: Date },
    experience: { type: Number, default: 0 }



    
  }
  
);

userSchema.pre('save',function(next){
  const user = this;
  const currentTapCount = user.tapCount;
  const divisions = Math.floor(currentTapCount / 3000);
  if(divisions >0){
    const newRank = divisions*user.rank
    user.rank = newRank
  }

  

  next()

})
module.exports = mongoose.model("User", userSchema);
