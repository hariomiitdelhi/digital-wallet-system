const rateLimit = require('express-rate-limit');
const config = require('../config/config');

// Rate limiting middleware to prevent brute force attacks
const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW, // 15 minutes by default
  max: config.RATE_LIMIT_MAX, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  }
});

module.exports = { apiLimiter };
