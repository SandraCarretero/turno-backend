const authService = require('../services/authService.js');

const {
  createUserValidations,
  loginUserValidations
} = require('../validations/userValidations');

const authController = {
  register: [
    ...createUserValidations,
    async (req, res) => {
      const result = await authService.register(req);
      res.status(result.status).json(result.data);
    }
  ],

  login: [
    ...loginUserValidations,
    async (req, res) => {
      const result = await authService.login(req);
      res.status(result.status).json(result.data);
    }
  ],

  verifyEmail: async (req, res) => {
    const result = await authService.verifyEmail(req.params.token);
    res.status(result.status).json(result.data);
  },

  getMe: async (req, res) => {
    const result = await authService.getMe(req.user._id);
    res.status(result.status).json(result.data);
  }
};
module.exports = authController;
