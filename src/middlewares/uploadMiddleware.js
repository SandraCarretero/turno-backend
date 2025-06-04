// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, '../../uploads/avatars'));
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed'), false);
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024
//   }
// });

// const uploadAvatarMiddleware = upload.single('avatar');

// module.exports = uploadAvatarMiddleware;

const { upload } = require("../config/cloudinary")

const uploadAvatarMiddleware = (req, res, next) => {
  console.log("=== MIDDLEWARE UPLOAD ===")
  console.log("Body:", req.body)
  console.log("Files:", req.file)

  const uploadSingle = upload.single("avatar")

  uploadSingle(req, res, (err) => {
    if (err) {
      console.error("Error específico en multer:", err)

      // Diferentes tipos de errores de multer
      if (err.code === "LIMIT_FILE_SIZE") {
        return next({
          message: "El archivo es demasiado grande (máximo 5MB)",
          code: "FILE_TOO_LARGE",
        })
      }

      if (err.message.includes("imagen")) {
        return next({
          message: "Solo se permiten archivos de imagen",
          code: "INVALID_FILE_TYPE",
        })
      }

      return next({
        message: err.message || "Error al procesar el archivo",
        code: err.code || "UPLOAD_ERROR",
      })
    }

    console.log("Middleware completado exitosamente")
    next()
  })
}

module.exports = uploadAvatarMiddleware

