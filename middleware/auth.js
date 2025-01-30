const  jwt = require("jsonwebtoken")
const User = require("../mongoose/models/User")
require('dotenv').config();

const authenticateUser = async (req, res, next) => {

  const {authorization} = req.headers

  if (!authorization) {
    return res.status(401).json({error:'Unauthorized request'})
  
   
    
} 




if (authorization && authorization.startsWith('Bearer')) {
  
  const  token =  authorization.split(' ')[1]


              
  
  try {
    // if (!token) {
    //   return res.status(401).json({ message: 'Authentication required' });
    // }
    
    const{telegramId} = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ telegramId });

    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.log(error)
    res.status(401).json({ message: `Invalid token${error.message}`  });
  }
};

}





  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  };
  


  module.exports = {authenticateUser, authenticateToken}