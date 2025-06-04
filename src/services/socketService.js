const { Server } = require("socket.io")
const { authenticateSocket } = require("../middlewares/authMiddleware")

exports.initSocketIO = (server, app) => {
  // Configurar orígenes permitidos para Socket.IO
  const allowedOrigins = [
    "https://turno-frontend.vercel.app", // Tu dominio de producción
    "http://localhost:5173", // Desarrollo local Vite
    "http://localhost:3000", // Desarrollo alternativo
  ]

  // Si hay una URL específica en las variables de entorno, añadirla
  if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
    allowedOrigins.push(process.env.FRONTEND_URL)
  }

  console.log("Socket.IO allowed origins:", allowedOrigins)

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Permitir solicitudes sin origin (como aplicaciones móviles o Postman)
        if (!origin) return callback(null, true)

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true)
        } else {
          console.error("Socket.IO CORS Error: Origin not allowed:", origin)
          callback(new Error("Not allowed by CORS"))
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Configuraciones adicionales para mejor compatibilidad
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  io.use(authenticateSocket)

  io.on("connection", (socket) => {
    console.log("User connected:", socket.userId)

    socket.join(`user_${socket.userId}`)

    socket.on("join_forum", () => {
      socket.join("forum")
    })

    socket.on("leave_forum", () => {
      socket.leave("forum")
    })

    socket.on("join_room", (roomId) => {
      socket.join(roomId)
      console.log(`User ${socket.userId} joined room ${roomId}`)
    })

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId)
      console.log(`User ${socket.userId} left room ${roomId}`)
    })

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.userId, "Reason:", reason)
    })

    socket.on("error", (error) => {
      console.error("Socket error for user", socket.userId, ":", error)
    })
  })

  app.set("io", io)

  return io
}
