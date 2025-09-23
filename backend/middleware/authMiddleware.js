const jwt = require('jsonwebtoken');
const cache = require('../services/cacheService');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.split(' ')[1];
  if (!token && req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) return res.status(401).json({ message: 'Access denied. No token.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const cacheKey = `user:${userId}`;
    let user = await cache.get(cacheKey);

    if (user) {
      req.user = JSON.parse(user);
    } else {
      user = await User.findById(userId).select('-password').lean();
      if (!user) return res.status(404).json({ message: 'User not found' });
      await cache.set(cacheKey, JSON.stringify(user), 300);
      req.user = user;
    }
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
