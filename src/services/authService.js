const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt'); // Añadir bcrypt
const User = require('../models/userModel');
const { sendRegistrationConfirmation } = require('./emailService');

const generateToken = userId =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const authService = {
  register: async req => {
    try {
      const { username, email, password } = req.body;

      if (
        !username ||
        typeof username !== 'string' ||
        username.trim().length === 0
      ) {
        return {
          status: 400,
          data: {
            errors: [
              {
                path: 'username',
                msg: 'Username inválido'
              }
            ]
          }
        };
      }

      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return {
          status: 400,
          data: {
            errors: [
              {
                path: 'email',
                msg: 'Email inválido'
              }
            ]
          }
        };
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim();

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return {
          status: 400,
          data: {
            errors: [
              {
                path: 'email',
                msg: 'Email ya registrado'
              }
            ]
          }
        };
      }

      // Verificar si el username ya existe
      const existingName = await User.findOne({ username: cleanUsername });
      if (existingName) {
        return {
          status: 400,
          data: {
            errors: [
              {
                path: 'username',
                msg: 'Nombre de usuario ya en uso'
              }
            ]
          }
        };
      }

      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // IMPORTANTE: NO hashear la contraseña aquí, el middleware pre('save') del modelo User lo hará
      const user = new User({
        username: cleanUsername,
        email: cleanEmail,
        password, // Contraseña sin hashear, el middleware se encargará
        emailVerificationToken
      });

      await user.save();
      console.log('User saved successfully');

      try {
        await sendRegistrationConfirmation({
          username: user.username,
          email: user.email
        });
      } catch (emailError) {
        console.error('❌ Error al enviar email:', emailError);
      }

      const token = generateToken(user._id);

      return {
        status: 201,
        data: {
          message: 'User created successfully. Welcome email sent!',
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified
          }
        }
      };
    } catch (error) {
      console.error('❌ Registration error:', error);

      // Si es un error de validación de Mongoose/base de datos
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field === 'username' ? 'username' : 'email';
        const message =
          field === 'username'
            ? 'Nombre de usuario ya en uso'
            : 'Email ya registrado';

        return {
          status: 400,
          data: {
            errors: [
              {
                path: fieldName,
                msg: message
              }
            ]
          }
        };
      }

      return {
        status: 500,
        data: {
          errors: [
            {
              msg: 'Error interno del servidor'
            }
          ]
        }
      };
    }
  },

  login: async req => {
    try {
      const { email, password } = req.body;
      console.log(`Login attempt for email: ${email}`);

      const user = await User.findOne({ email });
      console.log(`User found: ${user ? 'Yes' : 'No'}`);

      if (!user) {
        console.log('User not found in database');
        return { status: 400, data: { message: 'Invalid credentials' } };
      }

      // Usar el método comparePassword del modelo User
      const isPasswordValid = await user.comparePassword(password);
      console.log(`Password valid: ${isPasswordValid}`);

      if (!isPasswordValid) {
        return { status: 400, data: { message: 'Invalid credentials' } };
      }

      const token = generateToken(user._id);

      return {
        status: 200,
        data: {
          token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified
          }
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return { status: 500, data: { message: 'Server error' } };
    }
  },

  verifyEmail: async token => {
    try {
      const user = await User.findOne({ emailVerificationToken: token });
      if (!user) {
        return { status: 400, data: { message: 'Invalid verification token' } };
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      return { status: 200, data: { message: 'Email verified successfully' } };
    } catch (error) {
      console.error('Email verification error:', error);
      return { status: 500, data: { message: 'Server error' } };
    }
  },

  getMe: async userId => {
    try {
      const user = await User.findById(userId)
        .select('-password')
        .populate('friends.user', 'username avatar');

      return { status: 200, data: user };
    } catch (error) {
      console.error('Get me error:', error);
      return { status: 500, data: { message: 'Server error' } };
    }
  }
};

module.exports = authService;
