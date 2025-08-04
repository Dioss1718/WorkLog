const jwt = require('jsonwebtoken');
const User = require('../models/user');
// Load environment variables
require('dotenv').config();

const protect = async (req, res, next) => {
  let token;

  // Check if the authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token from the header
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by the ID in the token payload and attach it to the request object
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      // If token verification fails, send an unauthorized error
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is found in the header, send an unauthorized error
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };