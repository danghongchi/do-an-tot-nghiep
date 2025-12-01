const jwt = require('jsonwebtoken');
const config = require('../config');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token không hợp lệ' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  next();
};

const counselorAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không có thông tin user' });
  }
  
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ message: 'Chỉ counselor mới có quyền truy cập' });
  }
  
  next();
};

const userAuth = (req, res, next) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Chỉ user mới có quyền truy cập' });
  }
  next();
};

// Optional auth - cho phép cả người dùng đã đăng nhập và chưa đăng nhập
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // Không có token, tiếp tục nhưng không set req.user
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    // Token không hợp lệ, vẫn cho phép tiếp tục nhưng không set req.user
    req.user = null;
    next();
  }
};

module.exports = {
  auth,
  adminAuth,
  counselorAuth,
  userAuth,
  optionalAuth
};
