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
  const uploadSingle = upload.single("avatar")

  uploadSingle(req, res, (err) => {
    if (err) {
      console.error("Error en upload middleware:", err)
      return res.status(400).json({
        error: "Error al procesar la imagen",
        details: err.message,
      })
    }
    next()
  })
}

module.exports = uploadAvatarMiddleware
