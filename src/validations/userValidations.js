const { body, validationResult } = require('express-validator');

const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const updateUserValidations = [
  body('username')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      'El usuario solo puede contener letras, números, and underscores'
    ),
  body('email').isEmail().withMessage('Debe ser un email válido'),

  handleValidationResult
];

const createUserValidations = [
  body('username')
    .notEmpty()
    .withMessage('El usuario es requerido')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      'El usuario solo puede contener letras, números, and underscores'
    ),
  body('email')
    .notEmpty()
    .withMessage('El mail es requerido')
    .isEmail()
    .withMessage('Debe ser un email válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8 })
    .isStrongPassword({
      minSymbols: 1,
      minUppercase: 1,
      minNumbers: 1
    })
    .withMessage('Debe tener al menos un número, una mayúscula y un símbolo'),
  handleValidationResult
];

const loginUserValidations = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const createUserGuestValidations = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .trim(),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('avatar').optional().isString().withMessage('Avatar must be a string'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const guestUserValidations = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .trim(),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('avatar').optional().isString().withMessage('Avatar must be a string'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

module.exports = {
  updateUserValidations,
  createUserValidations,
  loginUserValidations,
  createUserGuestValidations,
  guestUserValidations
};
