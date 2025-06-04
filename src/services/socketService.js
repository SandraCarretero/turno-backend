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

  // Middleware de autenticación para sockets
  io.use(authenticateSocket);

  // Configuración de eventos de socket
  io.on('connection', socket => {
    console.log('User connected:', socket.userId);

    // Unir al usuario a su sala personal
    socket.join(`user_${socket.userId}`);

    // Eventos para unirse/salir del foro
    socket.on('join_forum', () => {
      socket.join('forum');
    });

    socket.on('leave_forum', () => {
      socket.leave('forum');
    });

    // Evento de desconexión
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });

  // Hacer io accesible en toda la aplicación
  app.set('io', io);

  return io;
};

