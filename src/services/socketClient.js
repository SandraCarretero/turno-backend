import { io } from "socket.io-client"

const getServerUrl = () => {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://turno-backend-fhmm.onrender.com"
  }

  return "http://localhost:5000"
}

console.log("Socket.IO connecting to:", getServerUrl())

const socket = io(getServerUrl(), {
  autoConnect: false,
  transports: ["websocket", "polling"], 
  timeout: 20000,
  forceNew: true,
  reconnection: true, 
  reconnectionAttempts: 5, 
  reconnectionDelay: 1000,
})

export const connectSocket = (token) => {
  if (token) {
    socket.auth = { token }
    socket.connect()
  }
}

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}

export const joinRoom = (roomId) => {
  if (socket.connected) {
    socket.emit("join_room", roomId)
  }
}

export const leaveRoom = (roomId) => {
  if (socket.connected) {
    socket.emit("leave_room", roomId)
  }
}

socket.on("connect", () => {
  console.log("✅ Connected to Socket.IO server:", socket.id)
})

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected from Socket.IO server:", reason)
})

socket.on("connect_error", (error) => {
  console.error("🔥 Socket.IO connection error:", error.message)
  console.error("Server URL:", getServerUrl())
})

socket.on("reconnect", (attemptNumber) => {
  console.log("🔄 Reconnected to Socket.IO server after", attemptNumber, "attempts")
})

socket.on("reconnect_error", (error) => {
  console.error("🔥 Socket.IO reconnection error:", error.message)
})

export default socket
