const { Server } = require('socket.io');
const { authenticateSocket } = require('../middlewares/authMiddleware');

/**
 * Inicializa y configura el servicio de Socket.IO
 * @param {Object} server - Servidor HTTP de Node.js
 * @param {Object} app - Aplicación Express
 * @returns {Object} - Instancia configurada de Socket.IO
 */

exports.initSocketIO = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.use(authenticateSocket);

  io.on('connection', socket => {
    console.log('User connected:', socket.userId);

    socket.join(`user_${socket.userId}`);

    socket.on('join_forum', () => {
      socket.join('forum');
    });

    socket.on('leave_forum', () => {
      socket.leave('forum');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });

  app.set('io', io);

  return io;
};

