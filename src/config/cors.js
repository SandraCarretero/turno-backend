// Configuración centralizada de CORS
const allowedOrigins = [
  "https://turno-frontend.vercel.app", // Producción
  "http://localhost:3000", // Desarrollo React/Next.js
  "http://localhost:5173", // Desarrollo Vite
  "http://localhost:4173", // Vite preview
  "http://127.0.0.1:5173", // Vite alternativo
  "http://127.0.0.1:3000", // React alternativo
]

// Añadir URLs de variables de entorno si existen
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL)
}

if (process.env.LOCAL_FRONTEND_URL && !allowedOrigins.includes(process.env.LOCAL_FRONTEND_URL)) {
  allowedOrigins.push(process.env.LOCAL_FRONTEND_URL)
}

const corsOptions = {
  origin: (origin, callback) => {
    console.log("CORS check for origin:", origin)

    // Permitir requests sin origin (Postman, apps móviles, etc.)
    if (!origin) {
      console.log("✓ Request without origin allowed")
      return callback(null, true)
    }

    // En desarrollo, ser más permisivo con localhost
    if (process.env.NODE_ENV === "development") {
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        console.log("✓ Development localhost origin allowed:", origin)
        return callback(null, true)
      }
    }

    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      console.log("✓ Origin allowed:", origin)
      callback(null, true)
    } else {
      console.log("✗ Origin blocked:", origin)
      console.log("Allowed origins:", allowedOrigins)
      callback(new Error(`CORS: Origin ${origin} not allowed`))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-Access-Token",
  ],
  exposedHeaders: ["Content-Length"],
  optionsSuccessStatus: 200, // Para navegadores legacy
}

module.exports = { corsOptions, allowedOrigins }
