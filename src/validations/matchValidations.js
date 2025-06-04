const { body, validationResult } = require('express-validator');

const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const matchValidations = [
  body('game.name').notEmpty().withMessage('Game name is required'),
  body('players')
    .isArray({ min: 1 })
    .withMessage('At least one player is required'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('location').notEmpty().withMessage('Location is required'),
  handleValidationResult
];

module.exports = matchValidations;
