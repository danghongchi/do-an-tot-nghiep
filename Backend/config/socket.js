const socketIo = require('socket.io');
const config = require('../config');

const initializeSocket = (server) => {
  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ].filter(Boolean);

  const io = socketIo(server, {
    path: '/socket.io',
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true
  });

  return io;
};

module.exports = initializeSocket;

